
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocumentType, DfdData, EtpData, RiscoData, OrcamentoData, OrcamentoItemGroup, EtpItem, RiskItem, EtpQualidadeItem } from '../types';

const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 20;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Style Constants - Common
const BORDER_COLOR_DARK = '#000000';
const TEXT_COLOR_NORMAL = '#000000';

// Style Constants - DFD Model
const HEADER_BLUE_DARK = '#2F5597';

// Style Constants - ORCAMENTO Model
const SECTION_HEADER_BLUE = '#2B4C7E'; // New Dark Blue
const TABLE_HEADER_YELLOW = '#FCE69D'; // Cream Yellow
const TABLE_FOOTER_BLUE = '#1F4E79';
const ITEM_GRAY_BG = '#F0F0F0'; // Light Gray for items
const QUESTION_BLUE_BG = '#DDEBF7'; // Light Blue for questions

let yPos = MARGIN_TOP;

const setDefaultFont = (doc: jsPDF) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_COLOR_NORMAL);
}

const checkAndAddPage = (doc: jsPDF, neededHeight: number) => {
    if (yPos + neededHeight > (PAGE_HEIGHT - MARGIN_BOTTOM)) {
        doc.addPage();
        yPos = MARGIN_TOP;
        return true;
    }
    return false;
};

// Helper to draw formatted signature (Name - Cargo)
const drawSignature = (doc: jsPDF, name: string, warName: string, cargo: string, funcao: string, x: number, y: number, align: 'center' | 'left' | 'right' = 'center') => {
    // Helper to normalize strings (remove accents)
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    // Convert full name to Title Case
    const toTitleCase = (str: string) => {
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };
    
    const fullName = toTitleCase(name || '');
    const warNameTokens = warName ? normalize(warName).split(/\s+/) : [];
    const cargoClean = cargo ? cargo.toUpperCase() : '';

    const nameParts = fullName.split(' ');
    
    // Calculate total width to center it properly
    let totalWidth = 0;
    
    // Measure Name (Size 11)
    doc.setFontSize(11);
    nameParts.forEach((part, idx) => {
         const partNorm = normalize(part);
         // Check match (exact match or substring if needed, but token match is safer for names)
         const isWarName = warNameTokens.some(token => partNorm === token);
         
         doc.setFont('helvetica', isWarName ? 'bold' : 'normal');
         totalWidth += doc.getTextWidth(part);
         if (idx < nameParts.length - 1) totalWidth += doc.getTextWidth(' ');
    });

    // Measure Separator and Cargo (Size 10, Bold)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const cargoText = ` - ${cargoClean}`;
    totalWidth += doc.getTextWidth(cargoText);
    
    // Determine Start X
    let currentX = x;
    if (align === 'center') {
         currentX = x - (totalWidth / 2);
    } else if (align === 'right') {
        currentX = x - totalWidth;
    }

    // Draw Name (Size 11)
    doc.setFontSize(11);
    nameParts.forEach((part, idx) => {
         const partNorm = normalize(part);
         const isWarName = warNameTokens.some(token => partNorm === token);
         
         doc.setFont('helvetica', isWarName ? 'bold' : 'normal');
         doc.text(part, currentX, y);
         currentX += doc.getTextWidth(part);
         
         if (idx < nameParts.length - 1) {
             doc.setFont('helvetica', 'normal'); 
             doc.text(' ', currentX, y);
             currentX += doc.getTextWidth(' ');
         }
    });

    // Draw Separator and Cargo (Size 10, Bold)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(cargoText, currentX, y);

    // Draw Function below (Size 11, Normal)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(funcao || '', x, y + 5, { align: align });
};


// --- DFD ---
const generateDfdPdf = (doc: jsPDF, data: DfdData) => {
    const aiParagraphs = (data as any).aiParagraphs as string[] | undefined;
    
    // 1. Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DOCUMENTO DE FORMALIZAÇÃO DA DEMANDA', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 15;

    // 2. Memo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Memorando nº ${data.numeroMemo}/${data.ano}`, MARGIN_LEFT, yPos);
    yPos += 15;

    // 3. Body
    doc.text(`À ${data.unidade || '... (unidade de compras do órgão)'},`, MARGIN_LEFT, yPos);
    yPos += 10;

    const addIndentedParagraph = (doc: jsPDF, text: string) => {
        const indent = 20; // 2cm
        const fontSize = 11;
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'normal');

        const spaceWidth = doc.getTextWidth(' ');
        const numSpaces = spaceWidth > 0 ? Math.floor(indent / spaceWidth) : 30;
        const indentString = ' '.repeat(numSpaces);
        
        const indentedText = indentString + text;
        const lines = doc.splitTextToSize(indentedText, USABLE_WIDTH);
        
        checkAndAddPage(doc, lines.length * 5 + 5);

        doc.text(lines, MARGIN_LEFT, yPos, { 
            align: 'justify',
            maxWidth: USABLE_WIDTH 
        });
        
        yPos += lines.length * 5;
        yPos += 5; // Add space between paragraphs
    };
    
    if (aiParagraphs && aiParagraphs.length > 0) {
        aiParagraphs.forEach(p => addIndentedParagraph(doc, p));
    } else {
         const cleanup = (text: string = '', makeLowercase: boolean = false): string => {
            let cleaned = text.trim();
            if (cleaned.endsWith('.')) {
                cleaned = cleaned.slice(0, -1);
            }
            if (makeLowercase && cleaned.length > 0) {
                cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
            }
            return cleaned;
        };

        const problema = cleanup(data.problema);
        const quantitativo = cleanup(data.quantitativo, true);
        const justificativaPrazo = cleanup(data.justificativaPrazo, true);
        
        const formattedPrazo = data.prazo ? new Date(data.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : '... (indicar prazo para o término do processo de compra)';

        const mainParagraph = `Solicito que seja providenciada a solução para ${problema || '... (expor o problema a ser solucionado)'}, para o qual se estima o quantitativo de ${quantitativo || '... (indicar a quantidade x periodicidade)'}. A aquisição/contratação deve ser concluída até ${formattedPrazo}, tendo em vista que ${justificativaPrazo || '... (justificar o prazo indicado)'}.`;

        addIndentedParagraph(doc, mainParagraph);
    }

    yPos += 10;

    doc.text('Por fim, ressalto que:', MARGIN_LEFT, yPos);
    yPos += 10;

    const checkboxSize = 4;
    const checkboxTextIndent = 7;
    const checkboxOptions = [
        { key: 'sim', text: 'a contratação pretendida está prevista no Plano de Contratações Anual deste exercício.'},
        { key: 'nao', text: 'a contratação pretendida não está prevista no Plano de Contratações Anual deste exercício.'},
        { key: 'inexistente', text: 'ainda não há Plano de Contratações Anual aprovado para este exercício.'},
    ];

    checkboxOptions.forEach(option => {
        checkAndAddPage(doc, 15);
        const isChecked = data.statusPCA === option.key;
        const textLines = doc.splitTextToSize(option.text, USABLE_WIDTH - checkboxTextIndent);
        
        const checkboxY = yPos - checkboxSize + 2;
        doc.setLineWidth(0.3);
        doc.rect(MARGIN_LEFT, checkboxY, checkboxSize, checkboxSize);
        if (isChecked) {
            doc.setFont('helvetica', 'bold');
            doc.text('X', MARGIN_LEFT + 1, yPos + 1);
            doc.setFont('helvetica', 'normal');
        }
        doc.setFontSize(11);
        doc.text(textLines, MARGIN_LEFT + checkboxTextIndent, yPos);
        yPos += textLines.length * 5 + 5;
    });
    
    yPos += 20;

    checkAndAddPage(doc, 40);
    yPos += 20;
    const date = new Date(data.data + 'T00:00:00');
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    doc.setFontSize(11);
    doc.text(`${data.cidade || 'Cidade'} (PA), ${formattedDate}.`, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 20;

    checkAndAddPage(doc, 25);
    yPos += 10;
    
    // DFD only has 1 signatory in the type definition currently, but uses similar logic
    const nomeCompleto = data.nome || 'Nome do Servidor';
    const nomeGuerra = data.nomeGuerra || '';
    const cargo = data.cargo || 'Cargo';
    const funcao = data.funcao || 'Função';
    
    drawSignature(doc, nomeCompleto, nomeGuerra, cargo, funcao, PAGE_WIDTH / 2, yPos);
};

// --- ETP ---
const generateEtpPdf = (doc: jsPDF, data: EtpData) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ESTUDO TÉCNICO PRELIMINAR (ETP)', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('A geração de PDF para este documento ainda não foi totalmente implementada.', MARGIN_LEFT, yPos);
    yPos += 10;
    doc.text(`PAE: ${data.pae || 'Não informado'}`, MARGIN_LEFT, yPos);
};

// --- ANÁLISE DE RISCO ---
const generateRiscoPdf = (doc: jsPDF, data: RiscoData) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ANÁLISE DE RISCO', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('A geração de PDF para este documento ainda não foi totalmente implementada.', MARGIN_LEFT, yPos);
    yPos += 10;
    doc.text(`PAE: ${data.pae || 'Não informado'}`, MARGIN_LEFT, yPos);
};

// --- ORÇAMENTO ---
const generateOrcamentoPdf = (doc: jsPDF, data: OrcamentoData) => {
    yPos = MARGIN_TOP;
    const formatCurrency = (value: number | string) => {
        const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
        if (isNaN(num) || num === 0) return 'R$ 0,00';
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
    
    const getSourceLabel = (key: string) => {
        const map: Record<string, string> = {
            'simas': 'SIMAS',
            'pncp': 'PNCP',
            'contratacaoSimilar': 'Similar',
            'nfe': 'NFe',
            'siteEspecializado': 'Site Esp.',
            'direta': 'Pesquisa Direta',
            'ata': 'Ata SRP'
        };
        return map[key] || key;
    };

    const drawSectionHeader = (title: string, subtitle: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const titleLines = doc.splitTextToSize(title, USABLE_WIDTH - 4); 
        const titleHeight = titleLines.length * 4;
        const totalHeight = titleHeight + (subtitle ? 5 : 0) + 5; 

        checkAndAddPage(doc, totalHeight + 10);
        
        doc.setFillColor(SECTION_HEADER_BLUE);
        doc.setDrawColor(0); 
        doc.rect(MARGIN_LEFT, yPos, USABLE_WIDTH, totalHeight, 'FD');
        
        doc.setTextColor(255, 255, 255); 

        let currentTextY = yPos + 4;
        doc.text(titleLines, PAGE_WIDTH / 2, currentTextY, { align: 'center' });
        
        if (subtitle) {
            currentTextY += titleHeight;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(subtitle, PAGE_WIDTH / 2, currentTextY, { align: 'center' });
        }
        
        doc.setTextColor(0, 0, 0); 
        yPos += totalHeight;
    };
    
    const drawCheckbox = (x: number, y: number, text: string, checked: boolean) => {
        doc.setFontSize(9);
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.rect(x, y - 3, 4, 4);
        if (checked) {
            doc.setFont('helvetica', 'bold');
            doc.text('X', x + 1, y + 0.5);
            doc.setFont('helvetica', 'normal');
        }
        doc.text(text, x + 5, y);
    };

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ORÇAMENTO ESTIMADO', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 6;
    doc.setFont('helvetica', 'italic');
    const paeYear = new Date(data.data).getFullYear();
    const paeVal = data.pae || 'NNNN';
    doc.text(`PAE n° ${paeYear}/${paeVal}`, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFont('helvetica', 'normal');

    // --- Section 1 ---
    drawSectionHeader('1 - DESCRIÇÃO DA CONTRATAÇÃO', '(art. 2º, I, do Decreto Estadual nº 2.734/2022)');
    
    const s1Head = [['', 'Item', 'Descrição', 'Código SIMAS', 'Und', 'Qtd']];
    const s1Body = data.itemGroups.map((g, index) => {
        const row: any[] = [];
        
        if (index === 0) {
             row.push({ 
                content: 'O QUE SERÁ\nPESQUISADO?', 
                rowSpan: data.itemGroups.length, 
                styles: { 
                    valign: 'middle' as const, 
                    halign: 'right' as const,
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'normal' as const, 
                    cellWidth: 35
                } 
            });
        }
        
        row.push({ content: g.itemTR, styles: { fillColor: ITEM_GRAY_BG } });
        row.push(g.descricao);
        row.push(g.codigoSimas);
        row.push(g.unidade);
        row.push(g.quantidadeTotal);
        
        return row;
    });

    autoTable(doc, {
        startY: yPos,
        head: s1Head,
        body: s1Body,
        theme: 'grid',
        didParseCell: (data) => {
            if (data.section === 'head' && data.column.index === 0) {
                data.cell.styles.fillColor = [255, 255, 255];
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.lineColor = BORDER_COLOR_DARK;
                data.cell.styles.lineWidth = 0.2;
            }
        },
        headStyles: { 
            fontStyle: 'bold', 
            fillColor: TABLE_HEADER_YELLOW, 
            textColor: TEXT_COLOR_NORMAL, 
            lineColor: BORDER_COLOR_DARK, 
            lineWidth: 0.2, 
            halign: 'center',
            fontSize: 9
        },
        styles: { 
            font: 'helvetica', 
            fontSize: 9, 
            cellPadding: 1.5, 
            lineColor: BORDER_COLOR_DARK, 
            lineWidth: 0.2,
            valign: 'middle',
            halign: 'center'
        },
        columnStyles: { 
            0: { cellWidth: 35 },
            1: { halign: 'center' as const, cellWidth: 15 }, 
            2: { halign: 'center' as const },
            3: { halign: 'center' as const }, 
            4: { halign: 'center' as const, cellWidth: 15 }, 
            5: { halign: 'center' as const, cellWidth: 15 } 
        },
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    });
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 8;

    // --- Section 2 ---
    drawSectionHeader('2 - FONTES CONSULTADAS PARA A PESQUISA DE PREÇO', '(art. 2º, III, e art. 4º do Decreto Estadual nº 2.734/2022)');

    const fontesMap = {
        'simas': 'SIMAS (banco referencial de preço).',
        'pncp': 'Portal Nacional de Compras Públicas (PNCP).',
        'contratacaoSimilar': 'Contratações similares feitas pela administração pública.',
        'nfe': 'Base nacional de notas fiscais eletrônicas.',
        'siteEspecializado': 'Mídia especializada.',
        'direta': 'Pesquisa direta com fornecedores.'
    };
    
    const half = Math.ceil(Object.keys(fontesMap).length / 2);
    const leftColumn = Object.entries(fontesMap).slice(0, half);
    const rightColumn = Object.entries(fontesMap).slice(half);

    const initialY = yPos + 5;
    let currentY = initialY;
    leftColumn.forEach(([key, label]) => {
        drawCheckbox(MARGIN_LEFT, currentY, label, data.fontesPesquisa.includes(key));
        currentY += 6;
    });

    currentY = initialY;
    rightColumn.forEach(([key, label]) => {
         drawCheckbox(MARGIN_LEFT + USABLE_WIDTH / 2, currentY, label, data.fontesPesquisa.includes(key));
         currentY += 6;
    });
    yPos = Math.max(initialY + leftColumn.length * 6, initialY + rightColumn.length * 6) + 4;
    
    // --- Section 3 ---
    drawSectionHeader('3 - JUSTIFICATIVA DA AUSÊNCIA DE PESQUISA DE PREÇO NO SIMAS, PORTAL NACIONAL DE COMPRAS PÚBLICAS OU EM CONTRATAÇÕES SIMILARES', '(art. 4°, §1°, do Decreto Estadual nº 2.734/2022)');
    const justificativaAusencia = data.justificativaAusenciaFonte.trim();
    const textToShowS3 = justificativaAusencia ? justificativaAusencia : 'Não se aplica.';
    
    autoTable(doc, {
        startY: yPos,
        body: [[textToShowS3]],
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 2, lineColor: BORDER_COLOR_DARK, lineWidth: 0.2 },
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    });
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 8;
    
    // --- Section 4 ---
    drawSectionHeader('4 - JUSTIFICATIVAS DA PESQUISA DIRETA COM FORNECEDORES', '(art. 2º, VIII, e art. 4º, V e §2º, do Decreto Estadual nº 2.734/2022)');
    
    const isExclusiveDireta = data.fontesPesquisa.length === 1 && data.fontesPesquisa.includes('direta');
    const suppliers = data.fornecedoresDiretos || [];
    const s4Body: any[] = [];

    // 4.1 Logic - Only "Sim" if EXCLUSIVE direct research.
    const checkSim = isExclusiveDireta ? '[ X ]' : '[   ]';
    const checkNao = !isExclusiveDireta ? '[ X ]' : '[   ]';
    // Enforce "Não se aplica" if not exclusive
    const just41 = isExclusiveDireta ? (data.justificativaPesquisaDireta || 'Não se aplica.') : 'Não se aplica.';

    // 4.1 Row
    s4Body.push([
        { 
            content: '4.1 - É CABÍVEL A UTILIZAÇÃO DA PESQUISA DIRETA COM FORNECEDORES?', 
            styles: { halign: 'left' as const, valign: 'middle' as const } 
        },
        { 
            content: `${checkSim} Sim\n${checkNao} Não`,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        },
        {
            content: `Justificativa: ${just41}`,
            styles: { halign: 'left' as const, valign: 'middle' as const }
        }
    ]);

    if (isExclusiveDireta) {
        if (suppliers.length > 0) {
            // 4.2 Rows
            suppliers.forEach((fornecedor, index) => {
                 const firstColContent = index === 0 ? {
                    content: '4.2 – QUAIS AS RAZÕES DA ESCOLHA DOS FORNECEDORES COTADOS?',
                    rowSpan: suppliers.length,
                    styles: { halign: 'left' as const, valign: 'middle' as const }
                 } : null;

                 const row: any[] = [];
                 if (firstColContent) row.push(firstColContent);
                 row.push({ content: fornecedor.nome, styles: { halign: 'center' as const, valign: 'middle' as const } });
                 row.push({ content: `Justificativa: ${fornecedor.justificativa}`, styles: { halign: 'left' as const, valign: 'middle' as const } });
                 s4Body.push(row);
            });

            // 4.3 Rows
            suppliers.forEach((fornecedor, index) => {
                 const firstColContent = index === 0 ? {
                    content: '4.3 - AS PROPOSTAS FORMAIS CONTÊM OS REQUISITOS?',
                    rowSpan: suppliers.length,
                    styles: { halign: 'left' as const, valign: 'middle' as const }
                 } : null;

                 const row: any[] = [];
                 if (firstColContent) row.push(firstColContent);
                 row.push({ content: fornecedor.nome, styles: { halign: 'center' as const, valign: 'middle' as const } });
                 row.push({ 
                    content: `[ ${fornecedor.requisitos === 'sim' ? 'X' : ' '} ] Sim\n[ ${fornecedor.requisitos === 'nao' ? 'X' : ' '} ] Não`,
                    styles: { halign: 'center' as const, valign: 'middle' as const } 
                 });
                 s4Body.push(row);
            });
        } else {
             // Empty suppliers case
             s4Body.push([
                 { content: '4.2 – QUAIS AS RAZÕES DA ESCOLHA DOS FORNECEDORES COTADOS?', styles: { halign: 'left' as const, valign: 'middle' as const } },
                 { content: '-', styles: { halign: 'center' as const, valign: 'middle' as const } },
                 { content: 'Justificativa: -', styles: { halign: 'left' as const, valign: 'middle' as const } }
            ]);
            s4Body.push([
                 { content: '4.3 - AS PROPOSTAS FORMAIS CONTÊM OS REQUISITOS?', styles: { halign: 'left' as const, valign: 'middle' as const } },
                 { content: '-', styles: { halign: 'center' as const, valign: 'middle' as const } },
                 { content: '-', styles: { halign: 'center' as const, valign: 'middle' as const } }
            ]);
        }
    }

    autoTable(doc, {
        startY: yPos,
        theme: 'grid',
        body: s4Body,
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5, lineColor: BORDER_COLOR_DARK, lineWidth: 0.2, valign: 'middle' },
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 45 },
            2: { cellWidth: 'auto' }
        }
    });
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 8;
    
    // --- Section 5 ---
    drawSectionHeader('5 - METODOLOGIA DA ESTIMATIVA DE PREÇO', '(art. 2º, V, e art. 5º do Decreto Estadual nº 2.734/2022)');
    
    const getMethodologyCell = (value: string, label: string) => {
         const isSelected = data.metodologia === value;
         return {
            content: `${isSelected ? '[ X ]' : '[   ]'} ${label}`,
            styles: { fontStyle: (isSelected ? 'bold' : 'normal') as 'bold' | 'normal' }
         };
    };
    
    autoTable(doc, {
        startY: yPos,
        body: [[
            getMethodologyCell('menor', 'Menor preço\n(mercado restrito)'),
            getMethodologyCell('media', 'Média\n(preços semelhantes)'),
            getMethodologyCell('mediana', 'Mediana\n(preços com grande variação)'),
        ]],
        theme: 'grid',
        styles: { font: 'helvetica', fontStyle: 'normal', fontSize: 9, cellPadding: 3, lineColor: BORDER_COLOR_DARK, lineWidth: 0.2, halign: 'center', valign: 'middle' },
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    });
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 8;

    // --- Section 6 ---
    drawSectionHeader('6 - RESULTADO DA PESQUISA', '(art. 2º, IV, VI e VII, do Decreto Estadual nº 2.734/2022)');
    
    const maxPrices = Math.max(1, ...data.itemGroups.map(g => (data.precosEncontrados[g.id] || []).length));
    
    // Group items by Lote
    const lotes: { [key: string]: typeof data.itemGroups } = {};
    const ungroupedItems: typeof data.itemGroups = [];
    
    data.itemGroups.forEach(group => {
        if (group.loteId) {
            if (!lotes[group.loteId]) lotes[group.loteId] = [];
            lotes[group.loteId].push(group);
        } else {
            ungroupedItems.push(group);
        }
    });

    // Sort Lote IDs numeric/alpha
    const sortedLoteIds = Object.keys(lotes).sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
        return numA - numB || a.localeCompare(b);
    });

    // Function to generate table for a set of items
    const generatePriceTable = (items: typeof data.itemGroups, title?: string) => {
        if (title) {
            checkAndAddPage(doc, 20); // Ensure space for title + header
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(title, PAGE_WIDTH / 2, yPos + 4, { align: 'center' });
            yPos += 6;
        }

        const priceBody = items.map(group => {
            const row: any[] = [];
            // Column 0: Item number with gray background
            row.push({ content: group.itemTR, styles: { fillColor: ITEM_GRAY_BG } });
            
            const prices = data.precosEncontrados[group.id] || [];
            
            // Fill prices
            for(let i=0; i<maxPrices; i++) {
                if(i < prices.length) {
                    const p = prices[i];
                    const val = p.value ? `R$ ${p.value}` : '-';
                    const sourceLabel = getSourceLabel(p.source);
                    row.push(`${val}\n(${sourceLabel})`);
                } else {
                    row.push('-');
                }
            }
            return row;
        });

        const priceHead = [
            [
                { content: 'Item', styles: { valign: 'middle' as const } },
                { content: 'Preços Encontrados', colSpan: maxPrices, styles: { halign: 'center' as const, valign: 'middle' as const } }
            ]
        ];

        autoTable(doc, {
            startY: yPos,
            head: priceHead,
            body: priceBody,
            theme: 'grid',
            headStyles: { fontStyle: 'bold', fillColor: TABLE_HEADER_YELLOW, textColor: TEXT_COLOR_NORMAL, lineColor: BORDER_COLOR_DARK, lineWidth: 0.2, halign: 'center' },
            styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, lineColor: BORDER_COLOR_DARK, lineWidth: 0.2, halign: 'center', valign: 'middle' },
            columnStyles: { 0: { cellWidth: 15 } },
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        });
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 5;
    };

    // Render Tables
    sortedLoteIds.forEach(loteId => {
        generatePriceTable(lotes[loteId], `LOTE ${loteId}`);
    });
    if (ungroupedItems.length > 0) {
        generatePriceTable(ungroupedItems, sortedLoteIds.length > 0 ? 'ITENS AVULSOS' : undefined);
    }
    yPos += 3;
    
    checkAndAddPage(doc, 15);
    
    // --- Houve Descarte de Preço Logic ---
    let justificativaFinal = '';
    if (data.houveDescarte === 'nao') {
        justificativaFinal = 'Justificativa: Não se aplica.';
    } else {
        const userText = data.justificativaDescarte ? data.justificativaDescarte : '(Indicar qual preço foi desconsiderado por ocasião do cálculo do preço de mercado e o motivo).';
        justificativaFinal = `Justificativa: ${userText}`;
        if (!justificativaFinal.toLowerCase().includes('justificativa:')) {
             justificativaFinal = 'Justificativa: ' + justificativaFinal;
        }
    }

    const isSim = data.houveDescarte === 'sim';
    const isNao = data.houveDescarte === 'nao';

    const discardBody = [
        [
            { 
                content: 'HOUVE DESCARTE DE PREÇO?', 
                rowSpan: 2,
                styles: { 
                    fontStyle: 'bold' as 'bold', 
                    fillColor: QUESTION_BLUE_BG, 
                    valign: 'middle' as const, 
                    halign: 'center' as const 
                } 
            },
            { 
                content: `[ ${isSim ? 'X' : ' '} ] Sim.`,
                styles: { 
                    fontStyle: (isSim ? 'bold' : 'normal') as 'bold' | 'normal', 
                    valign: 'bottom' as const, 
                    halign: 'left' as const,
                    cellPadding: { top: 1, bottom: 0, left: 2, right: 1 }
                } 
            },
            { 
                content: justificativaFinal,
                rowSpan: 2,
                styles: { valign: 'middle' as const, halign: 'left' as const }
            }
        ],
        [
            // Col 1 is spanned
            { 
                content: `[ ${isNao ? 'X' : ' '} ] Não.`,
                styles: { 
                    fontStyle: (isNao ? 'bold' : 'normal') as 'bold' | 'normal', 
                    valign: 'top' as const, 
                    halign: 'left' as const,
                    cellPadding: { top: 0, bottom: 1, left: 2, right: 1 }
                } 
            }
            // Col 3 is spanned
        ]
    ];
    
    autoTable(doc, {
        startY: yPos,
        theme: 'grid',
        body: discardBody,
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5, lineColor: BORDER_COLOR_DARK, lineWidth: 0.2, valign: 'middle' },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 25 },
            2: { cellWidth: 'auto' }
        },
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT }
    });
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 8;

    // --- New Comparison Table for Adesão and Aditivo ---
    if (data.tipoOrcamento === 'adesao_ata' || data.tipoOrcamento === 'aditivo_contratual') {
        checkAndAddPage(doc, 40);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        
        const tableTitle = data.tipoOrcamento === 'adesao_ata' 
            ? 'QUADRO COMPARATIVO DE PREÇOS (ADESÃO À ATA)'
            : 'QUADRO COMPARATIVO DE PREÇOS (ADITIVO CONTRATUAL)';
            
        doc.text(tableTitle, PAGE_WIDTH / 2, yPos, { align: 'center' });
        yPos += 8;

        const parseCurrencyToNum = (value: string | undefined): number | null => {
            if (!value) return null;
            const num = parseFloat(value.toString().replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
            return isNaN(num) ? null : num;
        };
        const calculateMarketValue = (prices: (string | undefined)[]): number => {
            const validPrices = prices.map(parseCurrencyToNum).filter((p): p is number => p !== null && p > 0);
            if (validPrices.length === 0) return 0;
            const sum = validPrices.reduce((a, b) => a + b, 0);
            return sum / validPrices.length;
        };

        const comparisonBody: any[] = [];
        
        // Header logic for Aditivo
        let colUnitarioHeader = 'Novo Valor Unitário';
        if (data.tipoOrcamento === 'aditivo_contratual') {
             if (data.haveraReajuste === 'sim' && data.porcentagemReajuste) {
                 colUnitarioHeader = `Valor Unitário com Reajuste ${data.porcentagemReajuste}%`;
             } else {
                 colUnitarioHeader = 'Valor Unitário sem Reajuste';
             }
        }

        data.itemGroups.forEach(group => {
            const itemPrices = data.precosEncontrados[group.id] || [];
            const includedPrices = itemPrices.filter(p => data.precosIncluidos[p.id] ?? true);
            const otherPrices = includedPrices.filter(p => p.source !== 'ata'); // For Aditivo, basically all valid external prices
            
            const valorMercado = calculateMarketValue(otherPrices.map(p => p.value));
            
            if (data.tipoOrcamento === 'adesao_ata') {
                const ataPrices = includedPrices.filter(p => p.source === 'ata');
                const precoAta = ataPrices.length > 0 ? (parseCurrencyToNum(ataPrices[0].value) ?? 0) : 0;
                const precoAdotado = group.estimativaUnitaria;
                
                comparisonBody.push([ 
                    group.itemTR, 
                    group.descricao.substring(0, 100) + (group.descricao.length > 100 ? '...' : ''), 
                    formatCurrency(valorMercado), 
                    formatCurrency(precoAta), 
                    formatCurrency(precoAdotado) 
                ]);
            } else {
                // Aditivo Logic
                const baseUnitPrice = group.estimativaUnitaria;
                const reajusteFactor = (data.haveraReajuste === 'sim' && data.porcentagemReajuste) ? (1 + (data.porcentagemReajuste / 100)) : 1;
                
                // Unit Price with readjustment
                const adjustedUnitPrice = baseUnitPrice * reajusteFactor;

                comparisonBody.push([ 
                    group.itemTR, 
                    group.descricao.substring(0, 100) + (group.descricao.length > 100 ? '...' : ''), 
                    formatCurrency(valorMercado), 
                    formatCurrency(adjustedUnitPrice), // Valor Unitário com/sem Reajuste
                    formatCurrency(adjustedUnitPrice)  // Preço Adotado (mesmo do novo unitário)
                ]);
            }
        });

        const headRow = data.tipoOrcamento === 'adesao_ata' 
            ? ['Item', 'Descrição', 'Valor de Mercado (Média)', 'Preço da Ata', 'Preço Adotado']
            : ['Item', 'Descrição', 'Valor de Mercado (Média)', colUnitarioHeader, 'Preço Adotado'];

        autoTable(doc, {
            startY: yPos,
            head: [headRow],
            body: comparisonBody,
            theme: 'grid',
            headStyles: { fontStyle: 'bold', fillColor: TABLE_HEADER_YELLOW, textColor: TEXT_COLOR_NORMAL, lineColor: BORDER_COLOR_DARK, lineWidth: 0.2, halign: 'center', fontSize: 9 },
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5, lineColor: BORDER_COLOR_DARK, lineWidth: 0.2, halign: 'center', valign: 'middle' },
            columnStyles: { 0: { cellWidth: 10 }, 1: { halign: 'left' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        });
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 10;
    }


    // --- Final Table ---
    checkAndAddPage(doc, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    
    const finalTitle = data.tipoOrcamento === 'aditivo_contratual' 
        ? 'PREÇO ESTIMADO DA ALTERAÇÃO CONTRATUAL'
        : 'PREÇO ESTIMADO DE MERCADO';
        
    doc.text(finalTitle, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 8;

    const resultTableBody: any[] = [];
    let grandTotal = 0;
    
    if (data.tipoOrcamento === 'aditivo_contratual') {
        // Logic for Aditivo
        data.itemGroups.forEach(group => {
             const baseUnitPrice = group.estimativaUnitaria;
             // Reajuste only for the aditivo quantities calculation part
             const reajusteFactor = (data.haveraReajuste === 'sim' && data.porcentagemReajuste) ? (1 + (data.porcentagemReajuste / 100)) : 1;
             const adjustedUnitPrice = baseUnitPrice * reajusteFactor;
             
             const aditivoQtd = group.aditivoQuantidade || 0;
             const aditivoValor = group.aditivoValor || 0;
             const porcentagemAditivo = group.aditivoPorcentagem ? `${group.aditivoPorcentagem.toLocaleString('pt-BR', {maximumFractionDigits: 2})}%` : '-';
             
             // Calculate new Global: "somando o valor global antes do aditivo com o aditivo"
             // "reajuste seja aplicado apenas às quantidades do aditivo" -> Original calculation uses base price
             const originalTotal = group.quantidadeTotal * baseUnitPrice;
             const newGlobal = originalTotal + aditivoValor;
             
             grandTotal += aditivoValor; // Footer shows Total Aditivo

             // Main Row
             resultTableBody.push([
                { content: group.itemTR, styles: { fillColor: ITEM_GRAY_BG } },
                group.descricao,
                porcentagemAditivo,
                formatCurrency(adjustedUnitPrice),
                aditivoQtd.toLocaleString('pt-BR', {maximumFractionDigits: 2}),
                formatCurrency(aditivoValor)
             ]);

             // Row for "Valor Inicial"
             resultTableBody.push([
                 {
                     content: `Valor Inicial: ${group.quantidadeTotal.toLocaleString('pt-BR', {maximumFractionDigits: 2})} (Qtd) x ${formatCurrency(baseUnitPrice)} (Unit.) = ${formatCurrency(originalTotal)}`,
                     colSpan: 6,
                     styles: { halign: 'right', fontSize: 8, textColor: [80, 80, 80] }
                 }
             ]);

             // Detail Row for "Novo Valor Global"
             resultTableBody.push([
                 { 
                     content: `Novo Valor Global (Contrato Original + Aditivo): ${formatCurrency(newGlobal)}`, 
                     colSpan: 6, 
                     styles: { halign: 'right', fillColor: QUESTION_BLUE_BG, fontStyle: 'bold' } 
                 }
             ]);
        });
        
        // The header for the aditivo specific columns
        autoTable(doc, {
            startY: yPos,
            head: [['Item', 'Descrição', 'Aditivo (%)', 'Valor Unit. (c/ Reajuste)', 'Qtd Aditivo', 'Valor Aditivo']],
            body: resultTableBody,
            foot: [[
                { content: 'TOTAL DO ADITIVO', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: TABLE_HEADER_YELLOW, textColor: TEXT_COLOR_NORMAL, fontSize: 9 } }, 
                { content: formatCurrency(grandTotal), styles: { fontStyle: 'bold', halign: 'right', fillColor: TABLE_HEADER_YELLOW, textColor: TEXT_COLOR_NORMAL, fontSize: 9 } }
            ]],
            theme: 'grid',
            headStyles: { fontStyle: 'bold', fillColor: TABLE_HEADER_YELLOW, textColor: TEXT_COLOR_NORMAL, lineColor: BORDER_COLOR_DARK, lineWidth: 0.2, halign: 'center', fontSize: 9 },
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5, lineColor: BORDER_COLOR_DARK, lineWidth: 0.2, halign: 'center', valign: 'middle' },
            columnStyles: { 
                0: { cellWidth: 15 },
                1: { halign: 'left' },
                2: { halign: 'center', cellWidth: 20 },
                3: { halign: 'right', cellWidth: 25 },
                4: { halign: 'center', cellWidth: 20 },
                5: { halign: 'right', cellWidth: 30 }
            },
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        });

    } else {
        // Standard Logic
        data.itemGroups.forEach(group => {
            const total = group.estimativaUnitaria * group.quantidadeTotal;
            grandTotal += total;

            const desc = group.descricao;

            if (group.cotas && group.cotas.length > 0) {
                const sortedCotas = [...group.cotas].sort((a, b) => {
                    if (a.tipo.includes('AMPLA')) return -1;
                    if (b.tipo.includes('AMPLA')) return 1;
                    return 0;
                });

                sortedCotas.forEach(cota => {
                    const subTotal = group.estimativaUnitaria * cota.quantidade;
                    let typeLabel: string = cota.tipo;
                    if (typeLabel.includes('AMPLA')) typeLabel = 'AMPLA';
                    if (typeLabel.includes('ME/EPP') && !typeLabel.includes('AMPLA')) typeLabel = 'ME/EPP';

                    resultTableBody.push([
                        { content: group.itemTR, styles: { fillColor: ITEM_GRAY_BG } },
                        desc,
                        typeLabel,
                        formatCurrency(group.estimativaUnitaria),
                        cota.quantidade,
                        formatCurrency(subTotal)
                    ]);
                });
            } else {
                resultTableBody.push([
                    { content: group.itemTR, styles: { fillColor: ITEM_GRAY_BG } },
                    desc,
                    '-',
                    formatCurrency(group.estimativaUnitaria),
                    group.quantidadeTotal,
                    formatCurrency(total)
                ]);
            }
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Item', 'Descrição', 'AMPLA OU ME/EPP', 'Valor Unit.', 'Qtd', 'Total']],
            body: resultTableBody,
            foot: [[
                { content: 'TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: TABLE_HEADER_YELLOW, textColor: TEXT_COLOR_NORMAL, fontSize: 9 } }, 
                { content: formatCurrency(grandTotal), styles: { fontStyle: 'bold', halign: 'right', fillColor: TABLE_HEADER_YELLOW, textColor: TEXT_COLOR_NORMAL, fontSize: 9 } }
            ]],
            theme: 'grid',
            headStyles: { fontStyle: 'bold', fillColor: TABLE_HEADER_YELLOW, textColor: TEXT_COLOR_NORMAL, lineColor: BORDER_COLOR_DARK, lineWidth: 0.2, halign: 'center', fontSize: 9 },
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5, lineColor: BORDER_COLOR_DARK, lineWidth: 0.2, halign: 'center', valign: 'middle' },
            columnStyles: { 
                0: { cellWidth: 15 },
                1: { halign: 'left' },
                2: { cellWidth: 25 },
                3: { halign: 'right', cellWidth: 25 },
                4: { cellWidth: 15 },
                5: { halign: 'right', cellWidth: 30 }
            },
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        });
    }
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 5;

    // --- Assinatura ---
    // Date
    const date = new Date(data.data + 'T00:00:00');
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    
    // Date aligned to right, not bold
    doc.setFont('helvetica', 'normal'); 
    doc.setFontSize(11);
    doc.text(`${data.cidade || 'Cidade'} (PA), ${formattedDate}.`, PAGE_WIDTH - MARGIN_RIGHT, yPos, { align: 'right' });
    yPos += 25;

    checkAndAddPage(doc, 40);
    
    // Two signatures
    const startY = yPos;
    const midPoint = PAGE_WIDTH / 2;
    
    // Lines
    const lineLength = 70;
    const gap = 20;
    
    // Calculate centered positions for 2 sigs
    // Sig 1: Left center = MARGIN_LEFT + (USABLE_WIDTH/2)/2 ? No, let's just split usable width
    
    const x1 = MARGIN_LEFT + (USABLE_WIDTH / 4);
    const x2 = MARGIN_LEFT + (USABLE_WIDTH * 3 / 4);
    
    // Draw Lines
    doc.setLineWidth(0.2);
    doc.line(x1 - (lineLength/2), startY, x1 + (lineLength/2), startY);
    doc.line(x2 - (lineLength/2), startY, x2 + (lineLength/2), startY);
    
    yPos += 5;

    // Signatory 1
    drawSignature(doc, data.assinante1Nome, data.assinante1NomeGuerra, data.assinante1Cargo, data.assinante1Funcao, x1, yPos, 'center');

    // Signatory 2
    drawSignature(doc, data.assinante2Nome, data.assinante2NomeGuerra, data.assinante2Cargo, data.assinante2Funcao, x2, yPos, 'center');
};


// --- Main PDF Generation Function ---
export const generatePdf = (docType: DocumentType, data: DfdData | EtpData | RiscoData | OrcamentoData): { success: boolean, error?: string } => {
    try {
        const doc = new jsPDF();
        setDefaultFont(doc);
        yPos = MARGIN_TOP;

        switch(docType) {
            case DocumentType.DFD:
                generateDfdPdf(doc, data as DfdData);
                break;
            case DocumentType.ETP:
                generateEtpPdf(doc, data as EtpData);
                break;
            case DocumentType.RISCO:
                generateRiscoPdf(doc, data as RiscoData);
                break;
            case DocumentType.ORCAMENTO:
                generateOrcamentoPdf(doc, data as OrcamentoData);
                break;
            default:
                throw new Error(`A geração de PDF para o tipo de documento "${docType}" não está implementada.`);
        }

        doc.save(`${docType}_${new Date().toISOString().split('T')[0]}.pdf`);
        return { success: true };

    } catch (e) {
        console.error("Erro ao gerar PDF:", e);
        const error = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido ao gerar o PDF.';
        return { success: false, error: error };
    }
};
