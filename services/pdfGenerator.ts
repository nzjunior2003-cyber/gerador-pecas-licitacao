
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocumentType, DfdData, EtpData, RiscoData, OrcamentoData, OrcamentoItemGroup, EtpItem, RiskItem, EtpQualidadeItem } from '../types';

// --- INSTRUÇÕES PARA ADICIONAR A FONTE MONTSERRAT ---
// 1. Obtenha os arquivos .ttf da fonte Montserrat (ex: Montserrat-Regular.ttf e Montserrat-Bold.ttf).
// 2. Converta cada arquivo .ttf para uma string Base64. Você pode usar uma ferramenta online.
// 3. Cole a string Base64 resultante nas variáveis correspondentes abaixo.
const montserratRegularBase64 = ''; 
const montserratBoldBase64 = ''; 

const FONT_FAMILY = 'Montserrat';
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 25;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Style Constants
const HEADER_BLUE_DARK = '#2F5597';
const HEADER_TEXT_WHITE = '#FFFFFF';
const BORDER_COLOR_DARK = '#444444';

// ETP Model Style Constants
const ETP_HEADER_BLUE = '#1F4E78';
const ETP_TABLE_HEADER_LIGHT_BLUE = '#DEEAF6';
const ETP_TEXT_BLACK = '#000000';
const ETP_TEXT_WHITE = '#FFFFFF';
const ETP_VIABILITY_BOX_YELLOW = '#FFF2CC';
const ETP_PRICE_TABLE_HEADER_YELLOW = '#FFC000';
const ETP_TABLE_BORDER_GRAY = '#BFBFBF';
const ETP_IMPACT_BOX_RED = '#F8CBAD';
const ETP_MITIGATION_BOX_BLUE = '#BDD7EE';
const ETP_QUESTION_BG_GRAY = '#F2F2F2';


// ORCAMENTO Model Style Constants
const ORCAMENTO_HEADER_GREEN = '#385723';
const ORCAMENTO_TABLE_HEADER_LIGHT_GREEN = '#E2EFDA';
const ORCAMENTO_TABLE_BORDER_GRAY = '#BFBFBF';


let yPos = MARGIN_TOP;

const registerMontserratFont = (doc: jsPDF) => {
    try {
        if (montserratRegularBase64 && montserratBoldBase64) {
            const fontList = doc.getFontList();
            if (fontList[FONT_FAMILY]) {
                return;
            }
            doc.addFileToVFS('Montserrat-Regular.ttf', montserratRegularBase64);
            doc.addFileToVFS('Montserrat-Bold.ttf', montserratBoldBase64);
            doc.addFont('Montserrat-Regular.ttf', FONT_FAMILY, 'normal');
            doc.addFont('Montserrat-Bold.ttf', FONT_FAMILY, 'bold');
        } else {
             console.warn("Dados da fonte Montserrat não fornecidos. Usando Helvetica.");
        }
    } catch (e) {
        console.error("Erro ao registrar a fonte Montserrat.", e);
    }
}

const setDefaultFont = (doc: jsPDF) => {
    try {
        doc.getFont(FONT_FAMILY, 'normal'); 
        doc.setFont(FONT_FAMILY, 'normal');
    } catch(e) {
        doc.setFont('helvetica', 'normal');
    }
}

const checkAndAddPage = (doc: jsPDF, neededHeight: number) => {
    if (yPos + neededHeight > (PAGE_HEIGHT - MARGIN_BOTTOM)) {
        doc.addPage();
        yPos = MARGIN_TOP;
        return true;
    }
    return false;
};

const addText = (doc: jsPDF, text: string, options: { isBold?: boolean, indent?: number, align?: 'justify' | 'left' | 'center' | 'right' } = {}) => {
    const { isBold = false, indent = 0, align = 'justify' } = options;
    const effectiveWidth = USABLE_WIDTH - indent;
    const lines = doc.splitTextToSize(text || 'Não informado.', effectiveWidth);
    
    checkAndAddPage(doc, lines.length * 5 + 2);

    doc.setFont(FONT_FAMILY, isBold ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.text(lines, MARGIN_LEFT + indent, yPos, { align });
    yPos += lines.length * 5;
};

const addSignatoryOld = (doc: jsPDF, data: { cidade: string; data: string; nome: string; cargo: string; funcao: string; }) => {
    checkAndAddPage(doc, 40);
    const date = new Date(data.data + 'T00:00:00');
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    addText(doc, `${data.cidade} (PA), ${formattedDate}.`);
    yPos += 30;

    checkAndAddPage(doc, 20);
    addText(doc, data.nome, { isBold: true });
    yPos -= 2; // small adjustment
    addText(doc, data.cargo);
    addText(doc, `Função: ${data.funcao}`);
};

const commonAutoTableOptions = {
    theme: 'grid' as const,
    styles: { font: FONT_FAMILY, fontSize: 9, cellPadding: 2, lineColor: BORDER_COLOR_DARK, lineWidth: 0.1 },
    headStyles: { fillColor: HEADER_BLUE_DARK, textColor: HEADER_TEXT_WHITE, fontStyle: 'bold' as const },
    footStyles: { fillColor: '#EAEAEA', textColor: '#000000', fontStyle: 'bold' as const },
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
};

// --- DFD ---
const generateDfdPdf = (doc: jsPDF, data: DfdData) => {
    // 1. Title
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(12);
    doc.text('DOCUMENTO DE FORMALIZAÇÃO DA DEMANDA', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 15;

    // 2. Memo
    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(11);
    doc.text(`Memorando nº ${data.numeroMemo}/${data.ano}`, MARGIN_LEFT, yPos);
    yPos += 15;

    // 3. Body
    doc.text(`À ${data.unidade || '... (unidade de compras do órgão)'},`, MARGIN_LEFT, yPos);
    yPos += 15;

    const bodyStyle = {
        align: 'justify' as const,
        lineHeightFactor: 1.5
    };

    const p1 = `Solicito que seja providenciada a solução para ${data.problema || '... (expor o problema a ser solucionado)'}.`;
    let lines = doc.splitTextToSize(p1, USABLE_WIDTH);
    doc.text(lines, MARGIN_LEFT, yPos, bodyStyle);
    yPos += lines.length * 5 * bodyStyle.lineHeightFactor;
    yPos += 5;

    const p2 = `Estimo que o quantitativo necessário é de ${data.quantitativo || '... (indicar a quantidade x periodicidade)'}.`;
    lines = doc.splitTextToSize(p2, USABLE_WIDTH);
    doc.text(lines, MARGIN_LEFT, yPos, bodyStyle);
    yPos += lines.length * 5 * bodyStyle.lineHeightFactor;
    yPos += 5;
    
    const formattedPrazo = data.prazo ? new Date(data.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : '... (indicar prazo para o término do processo de compra)';
    const p3 = `Informo que a aquisição deve ser feita até ${formattedPrazo}, considerando que ${data.justificativaPrazo || '... (justificar o prazo indicado)'}.`;
    lines = doc.splitTextToSize(p3, USABLE_WIDTH);
    doc.text(lines, MARGIN_LEFT, yPos, bodyStyle);
    yPos += lines.length * 5 * bodyStyle.lineHeightFactor;
    yPos += 10;

    doc.text('Por fim, ressalto que:', MARGIN_LEFT, yPos);
    yPos += 10;

    // 4. Checkboxes
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
            doc.setFont(FONT_FAMILY, 'bold');
            doc.text('X', MARGIN_LEFT + 1, yPos + 1);
            doc.setFont(FONT_FAMILY, 'normal');
        }

        doc.text(textLines, MARGIN_LEFT + checkboxTextIndent, yPos);
        yPos += textLines.length * 5 + 5;
    });
    
    yPos += 20;

    // 5. Signature
    checkAndAddPage(doc, 40);
    const date = new Date(data.data + 'T00:00:00');
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    doc.text(`${data.cidade || 'Cidade'} (PA), ${formattedDate}.`, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 30;

    doc.text('(Assinatura)', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text((data.nome || 'NOME DO SERVIDOR').toUpperCase(), PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 6;
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text(`${data.cargo || 'Cargo'} e ${data.funcao || 'função'}`, PAGE_WIDTH / 2, yPos, { align: 'center' });
};


// --- ETP ---

const addEtpHeaderBar = (doc: jsPDF, number: string, title: string, legalRef?: string) => {
    checkAndAddPage(doc, 20); // Min height for a header
    yPos += 4;
    const barStartY = yPos;
    
    const titleText = `${number} – ${title.toUpperCase()}`;
    const titleFontSize = 10;
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(titleFontSize);
    const titleLines = doc.splitTextToSize(titleText, USABLE_WIDTH - 6);
    
    let barHeight = titleLines.length * 4.5 + 6;

    let legalRefLines: string[] = [];
    if (legalRef) {
        const legalRefFontSize = 8;
        doc.setFont(FONT_FAMILY, 'bold');
        doc.setFontSize(legalRefFontSize);
        legalRefLines = doc.splitTextToSize(legalRef, USABLE_WIDTH - 6);
        barHeight += legalRefLines.length * 3.5 + 2;
    }

    doc.setFillColor(ETP_HEADER_BLUE);
    doc.rect(MARGIN_LEFT, barStartY, USABLE_WIDTH, barHeight, 'F');
    
    doc.setTextColor(ETP_TEXT_WHITE);
    
    let textY = barStartY + 4;
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(titleFontSize);
    doc.text(titleLines, PAGE_WIDTH / 2, textY + 1, { align: 'center', baseline: 'top' });
    textY += titleLines.length * 4.5 + 2;

    if (legalRef) {
        doc.setFont(FONT_FAMILY, 'bold');
        doc.setFontSize(8);
        doc.text(legalRefLines, PAGE_WIDTH / 2, textY, { align: 'center', baseline: 'top' });
    }
    
    yPos = barStartY + barHeight;
}

const generateEtpPdf = (doc: jsPDF, data: EtpData) => {
    // --- TITLE ---
    doc.setFontSize(12);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text(`ESTUDO TÉCNICO PRELIMINAR N° ${data.numero || 'XX'}/${data.ano || '2023'}`, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 7;
    doc.setFontSize(11);
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text(`PAE nº ${data.pae || 'aaaa/nnnn'}`, PAGE_WIDTH / 2, yPos, { align: 'center' });
    
    const tableOptions = {
        theme: 'grid' as const,
        styles: { font: FONT_FAMILY, fontSize: 10, cellPadding: 1.5, lineColor: ETP_TABLE_BORDER_GRAY, lineWidth: 0.2, valign: 'middle' as const },
        columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' as const, fontSize: 10, fillColor: ETP_QUESTION_BG_GRAY, halign: 'right' as const, cellPadding: { right: 4 } }, 1: { halign: 'justify' as const } },
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        didDrawPage: (hookData: any) => { yPos = hookData.cursor?.y || yPos; },
        willDrawCell: (hookData: any) => {
            const { cell } = hookData;
            const raw = cell.raw;
            let optionsData;
            if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
                if (raw.type === 'multiOption') optionsData = raw;
                else if (raw.content && raw.content.type === 'multiOption') optionsData = raw.content;
            }
            if (optionsData) {
                cell.text = ''; // Clear text so default renderer does nothing.
            }
        },
        didDrawCell: (hookData: any) => {
            const { cell, doc: tableDoc, column } = hookData;
            const raw = cell.raw;
            let optionsData;
            if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
                if (raw.type === 'multiOption') optionsData = raw;
                else if (raw.content && raw.content.type === 'multiOption') optionsData = raw.content;
                else if (raw.type === 'nestedTable') {
                     autoTable(tableDoc, {
                        ...raw.options,
                        startY: cell.y + 2,
                        margin: { left: cell.x + 2 },
                        tableWidth: cell.width - 4,
                    });
                } else if (raw.type === 'impactMitigation') {
                    const splitY = cell.y + cell.height / 2;
                    const textWidth = cell.width - 8;
                    tableDoc.setFillColor(ETP_IMPACT_BOX_RED);
                    tableDoc.rect(cell.x, cell.y, cell.width, cell.height / 2, 'F');
                    tableDoc.setFont(FONT_FAMILY, 'bold');
                    tableDoc.setTextColor(ETP_TEXT_BLACK);
                    tableDoc.text("Impactos:", cell.x + 3, cell.y + 5);
                    tableDoc.setFont(FONT_FAMILY, 'normal');
                    const impactLines = tableDoc.splitTextToSize(raw.impactos, textWidth);
                    tableDoc.text(impactLines, cell.x + 3, cell.y + 10);
                    tableDoc.setFillColor(ETP_MITIGATION_BOX_BLUE);
                    tableDoc.rect(cell.x, splitY, cell.width, cell.height / 2, 'F');
                    tableDoc.setFont(FONT_FAMILY, 'bold');
                    tableDoc.text("Medidas de mitigação:", cell.x + 3, splitY + 5);
                    tableDoc.setFont(FONT_FAMILY, 'normal');
                    const mitigationLines = tableDoc.splitTextToSize(raw.medidasMitigacao, textWidth);
                    tableDoc.text(mitigationLines, cell.x + 3, splitY + 10);
                }
            }
            if (optionsData) {
                const options = optionsData.options;
                let cursorY = cell.y + 4; 
                const lineHeight = 5;
                const checkboxSize = 3;
                const checkboxTextGap = 2;
                const startX = cell.x + 3;

                options.forEach((opt: any) => {
                    if (!opt || cursorY > cell.y + cell.height - lineHeight) return;

                    if (typeof opt.selected === 'boolean') {
                        tableDoc.setFont(FONT_FAMILY, opt.selected ? 'bold' : 'normal');
                        tableDoc.setTextColor(ETP_TEXT_BLACK);

                        if (opt.selected) {
                            tableDoc.text('X', startX, cursorY);
                        } else {
                            tableDoc.setFont(FONT_FAMILY, 'normal');
                            tableDoc.setLineWidth(0.2);
                            tableDoc.rect(startX, cursorY - checkboxSize, checkboxSize, checkboxSize);
                        }
                        
                        const textX = startX + checkboxSize + checkboxTextGap;
                        const textLines = tableDoc.splitTextToSize(opt.text || '', cell.width - (textX - cell.x) - 3);
                        tableDoc.setFont(FONT_FAMILY, opt.selected ? 'bold' : 'normal');
                        tableDoc.text(textLines, textX, cursorY);
                        cursorY += textLines.length * lineHeight;
                    } else { // Handle plain text lines (for justifications, etc.)
                        const textLines = tableDoc.splitTextToSize(opt.text || '', cell.width - 6);
                        tableDoc.setFont(FONT_FAMILY, 'normal');
                        tableDoc.text(textLines, startX, cursorY);
                        cursorY += textLines.length * lineHeight;
                    }
                });
            }
        }
    };
    
    // --- SECTION 1 ---
    addEtpHeaderBar(doc, '1', 'DESCRIÇÃO DA NECESSIDADE', '(art. 18, §1º, I, da Lei Federal nº 14.133/21)');
    autoTable(doc, { ...tableOptions, startY: yPos, body: [ [ '1.1 - QUAL A NECESSIDADE A SER ATENDIDA?', data.necessidade || 'Não informado.'] ] });
    yPos = (doc as any).lastAutoTable.finalY;

    // --- SECTION 2 ---
    addEtpHeaderBar(doc, '2', 'LEVANTAMENTO DE MERCADO', '(arts. 18, §1º, V, e 44 da Lei Federal nº 14.133/21)');
    const fontesOptions = ['Consulta a fornecedores', 'Internet', 'Contratações similares', 'Audiência pública', 'Outro'];
    const fontesAnswer = { type: 'multiOption', options: fontesOptions.map(opt => {
        const isChecked = data.fontesPesquisa.includes(opt);
        let text = opt;
        if (opt === 'Outro') text += isChecked && data.fonteOutro ? `: ${data.fonteOutro}` : ': _________________';
        return { text, selected: isChecked };
    })};
    const restricaoAnswer = { type: 'multiOption', options: [{text: 'Sim.', selected: data.restricaoFornecedores === 'sim'}, {text: 'Não.', selected: data.restricaoFornecedores === 'nao'}] };

    autoTable(doc, { ...tableOptions, startY: yPos, body: [
        ['2.1 - ONDE FORAM PESQUISADAS AS POSSÍVEIS SOLUÇÕES?', { content: fontesAnswer, styles: { halign: 'left' } }],
        ['2.2 - JUSTIFICATIVA TÉCNICA E ECONÔMICA PARA A ESCOLHA DA MELHOR SOLUÇÃO', data.justificativaTecnica || 'Não informado.'],
        ['2.3 - HÁ RESTRIÇÃO DE FORNECEDORES?', { content: restricaoAnswer, styles: { halign: 'left' } }],
    ]});
    yPos = (doc as any).lastAutoTable.finalY;

    // --- SECTION 3 ---
    addEtpHeaderBar(doc, '3', 'DESCRIÇÃO DOS REQUISITOS DE CONTRATAÇÃO', '(art. 18, §1º, III, da Lei Federal nº 14.133/21)');
    const tipoObjetoOpts = [ {val: 'bem', label: 'Bem.'}, {val: 'servico', label: 'Serviço.'}, {val: 'locacao', label: 'Locação de imóvel.'}, {val: 'obra', label: 'Obra ou serviço de engenharia.'}];
    const tipoObjetoAnswer = { type: 'multiOption', options: tipoObjetoOpts.map(o => ({ text: o.label, selected: data.tipoObjeto.includes(o.val) })) };
    const naturezaAnswer = { type: 'multiOption', options: [{text: 'Continuada.', selected: data.natureza === 'continuada'}, {text: 'Não continuada.', selected: data.natureza === 'nao-continuada'}]};
    const monopolioAnswer = { type: 'multiOption', options: [{text: 'Sim, apenas um único fornecedor é capaz de atender a demanda.', selected: data.monopolio === 'sim'}, {text: 'Não, há mais de um fornecedor capaz de atender a demanda.', selected: data.monopolio === 'nao'}]};
    
    const vigenciaOpts = [{val: '30 dias (pronta entrega).', label: '30 dias (pronta entrega).'}, {val: '180 dias.', label: '180 dias.'}, {val: '12 meses.', label: '12 meses.'}, {val: 'Indeterminado.', label: 'Indeterminado.'}, {val: 'outro', label: 'Outro:'}];
    const vigenciaAnswer = { type: 'multiOption', options: vigenciaOpts.map(o => ({ text: o.label + (o.val === 'outro' ? ` ${data.vigenciaOutroNum || '____'} ${data.vigenciaOutroTipo || '____'}` : ''), selected: data.vigencia === o.val}))};

    const prorrogacaoAnswer = { type: 'multiOption', options: [{text: 'Sim', selected: data.prorrogacao === 'sim'}, {text: 'Não', selected: data.prorrogacao === 'nao'}, {text: 'Não se aplica porque o prazo é indeterminado.', selected: data.prorrogacao === 'na'}]};
    // FIX: Explicitly type the options array to allow mixed types (with/without 'selected' property).
    const transicaoOptions: Array<{text: string; selected?: boolean}> = [{text: 'Sim', selected: data.transicao === 'sim'}, {text: 'Não', selected: data.transicao === 'nao'}];
    if (data.transicao === 'sim') {
        transicaoOptions.push({ text: `\nContrato nº: ${data.transicaoContrato || 'nnnn/aaaa'}` }, { text: `Prazo final: ${data.transicaoPrazo || 'dd/mm/aaaa'}` });
    }
    const transicaoAnswer = { type: 'multiOption', options: transicaoOptions };

    const sustentabilidadeOptions = ['Utilização de bens constituídos, no todo ou em parte, por material reciclado, atóxico e biodegradável, conforme as normas técnicas aplicáveis.', 'Não utilização de bens e produtos com substâncias perigosas em concentração acima da recomendada na diretiva RoHS (RestrictionofCertainHazardousSubstances) e outras diretivas similares, tais como mercúrio (Hg), chumbo (Pb), cromo hexavalente [Cr(VI)], cádmio (Cd), bifenil-polibromados (PBB’s) e éteres difenil-polibromados (PBDE’s).', 'Atendimento aos requisitos ambientais para a obtenção de certificação pelos órgãos competentes como produtos sustentáveis e/ou de menor impacto ambiental em relação aos seus similares.', 'Maior ciclo de vida e menor custo de manutenção do bem.', 'Utilização, preferencial, de embalagem adequada, com o menor volume possível, que utilize materiais recicláveis, de forma a garantir a máxima proteção durante o transporte e o armazenamento.', 'Não foram adotados critérios de sustentabilidade, conforme fundamentação técnica e mercadológica em anexo.', 'Outro.'];
    const sustentabilidadeAnswer = { type: 'multiOption', options: sustentabilidadeOptions.map(opt => {
        const isChecked = data.sustentabilidade.includes(opt);
        let text = opt;
        if(opt === 'Outro.') text += isChecked && data.sustentabilidadeOutro ? `: ${data.sustentabilidadeOutro}` : ': _________________';
        return { text, selected: isChecked };
    })};
    
    const prioridadeOpts = [{val: 'reciclados', label: 'Sim, para produtos reciclados e recicláveis.'}, {val: 'sustentaveis', label: 'Sim, para bens, serviços e obras que considerem critérios compatíveis com padrões de consumo social e ambientalmente sustentáveis.'}, {val: 'nao', label: 'Não.'}];
    // FIX: Explicitly type the options array to allow mixed types (with/without 'selected' property).
    const prioridadeOptions: Array<{text: string, selected?: boolean}> = prioridadeOpts.map(o => ({ text: o.label, selected: data.prioridadeLeiTipo === o.val }));
    prioridadeOptions.push({ text: `\nJustificativa: ${data.prioridadeLeiJustificativa || '________________'}` });
    const prioridadeAnswer = { type: 'multiOption', options: prioridadeOptions };

    const treinamentoAnswer = { type: 'multiOption', options: [{text: 'Sim.', selected: data.treinamento === 'sim'}, {text: 'Não.', selected: data.treinamento === 'nao'}]};

    autoTable(doc, { ...tableOptions, startY: yPos, body: [
        ['3.1 - QUAL O TIPO DE OBJETO?', { content: tipoObjetoAnswer, styles: { halign: 'left' } }],
        ['3.2 - QUAL A NATUREZA?', { content: naturezaAnswer, styles: { halign: 'left' } }],
        ['3.3 - HÁ MONOPÓLIO?', { content: monopolioAnswer, styles: { halign: 'left' } }],
        ['3.4 - QUAL A VIGÊNCIA?', { content: vigenciaAnswer, styles: { halign: 'left' } }],
        ['3.5 - PODERÁ HAVER PRORROGAÇÃO?', { content: prorrogacaoAnswer, styles: { halign: 'left' } }],
        ['3.6 - HÁ TRANSIÇÃO COM CONTRATO ANTERIOR?', { content: transicaoAnswer, styles: { halign: 'left' } }],
        ['3.7 - PADRÃO MÍNIMO DE QUALIDADE', { type: 'nestedTable', options: { head: [['Item', 'Descrição detalhada']], body: data.padraoQualidade.length > 0 ? data.padraoQualidade.map((item, index) => [index + 1, item.descricao]) : [['1','']], theme: 'grid', styles: { font: FONT_FAMILY, fontSize: 9, cellPadding: 1.5, lineColor: ETP_TABLE_BORDER_GRAY, lineWidth: 0.2 }, headStyles: { fillColor: ETP_TABLE_HEADER_LIGHT_BLUE, textColor: ETP_TEXT_BLACK, fontStyle: 'bold', halign: 'center' }, columnStyles: { 0: { cellWidth: 20, halign: 'center' }, 1: { cellWidth: 'auto', halign: 'justify' } } } }],
        ['3.8 - QUAIS CRITÉRIOS DE SUSTENTABILIDADE?', { content: sustentabilidadeAnswer, styles: { halign: 'left' }}],
        ['3.9 - HÁ PRIORIDADE PARA AQUISIÇÃO OU CONTRATAÇÃO, CONFORME LEI Nº 12.035/2010?', { content: prioridadeAnswer, styles: { halign: 'left' }}],
        ['3.10 - HÁ NECESSIDADE DE TREINAMENTO?', { content: treinamentoAnswer, styles: { halign: 'left' } }],
    ]});
    yPos = (doc as any).lastAutoTable.finalY;
    
    // --- SECTION 4 ---
    addEtpHeaderBar(doc, '4', 'DESCRIÇÃO DA SOLUÇÃO', '(art. 18, §1º, VII, da Lei Federal nº 14.133/21)');
    const garantiaOpts = [{val: 'nao_ha', label: 'Não há.'}, {val: '90_dias', label: '90 dias.'}, {val: '12_meses', label: '12 meses.'}, {val: 'outro', label: 'Outro:'}];
    const garantiaAnswer = { type: 'multiOption', options: garantiaOpts.map(o => ({ text: o.label + (o.val === 'outro' ? ` ${data.garantiaOutroNum || '____'} ${data.garantiaOutroTipo || '____'}` : ''), selected: data.garantiaContratual === o.val }))};
    const assistenciaAnswer = { type: 'multiOption', options: [{text: 'Sim.', selected: data.assistenciaTecnica === 'sim'}, {text: 'Não.', selected: data.assistenciaTecnica === 'nao'}]};
    const manutencaoAnswer = { type: 'multiOption', options: [{text: 'Sim.', selected: data.manutencao === 'sim'}, {text: 'Não.', selected: data.manutencao === 'nao'}]};

    autoTable(doc, { ...tableOptions, startY: yPos, body: [
        ['4.1 - O QUE SERÁ CONTRATADO?', data.solucaoContratacao || '(Aquisição, fornecimento ou prestação) de (descrever o objeto de forma ampla sem repetir a descrição detalhada do item).'],
        ['4.2 - QUAL O PRAZO DA GARANTIA CONTRATUAL?', { content: garantiaAnswer, styles: { halign: 'left' } }],
        ['4.3 - HÁ NECESSIDADE DE ASSISTÊNCIA TÉCNICA?', { content: assistenciaAnswer, styles: { halign: 'left' } }],
        ['4.4 - HÁ NECESSIDADE DE MANUTENÇÃO?', { content: manutencaoAnswer, styles: { halign: 'left' } }],
    ]});
    yPos = (doc as any).lastAutoTable.finalY;
    
    // --- SECTION 5 ---
    addEtpHeaderBar(doc, '5', 'DIMENSIONAMENTO DO OBJETO', '(art. 18, §1º, IV, da Lei Federal nº 14.133/21)');
    const metodoOptions = ['Análise de contratações anteriores.', 'Levantamento atual.', 'Análise de contratações similares.', 'Outro.'];
    const metodoAnswer = { type: 'multiOption', options: metodoOptions.map(opt => {
        const isChecked = data.metodoQuantitativo.includes(opt);
        let text = opt;
        if(opt === 'Outro.') text += isChecked && data.metodoOutro ? `: ${data.metodoOutro}` : ': _________________';
        return { text, selected: isChecked };
    })};
    autoTable(doc, { ...tableOptions, startY: yPos, body: [
        ['5.1 - COMO SE OBTEVE O QUANTITATIVO ESTIMADO?', { content: metodoAnswer, styles: { halign: 'left' } }],
        ['5.2 - DESCRIÇÃO DO QUANTITATIVO', data.descricaoQuantitativo || 'Não informado.'],
        ['5.3 - ESPECIFICAÇÃO', { type: 'nestedTable', options: { head: [['Item', 'Descrição', 'Und', 'Qtd']], body: data.itens.length > 0 ? data.itens.map((item, index) => [index + 1, item.descricao, item.unidade, item.quantidade]) : [['1','','','']], theme: 'grid', styles: { font: FONT_FAMILY, fontSize: 9, cellPadding: 1.5, lineColor: ETP_TABLE_BORDER_GRAY, lineWidth: 0.2 }, headStyles: { fillColor: ETP_TABLE_HEADER_LIGHT_BLUE, textColor: ETP_TEXT_BLACK, fontStyle: 'bold', halign: 'center' }, columnStyles: { 0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 'auto', halign: 'justify' }, 2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 20, halign: 'center' } } } }],
        ['5.4 - EM CASO DE BEM IMÓVEL...', 'Item prejudicado, não se trata de imóvel.'],
        ['5.5 - EM CASO DE BEM IMÓVEL...', 'Item prejudicado, não se trata de aquisição ou locação de imóvel.'],
    ]});
    yPos = (doc as any).lastAutoTable.finalY;

    // --- SECTION 6 ---
    addEtpHeaderBar(doc, '6', 'ESTIMATIVA DO VALOR DA CONTRATAÇÃO', '(art. 18, §1º, VI, da Lei Federal nº 14.133/21)');
    const totalGeral = data.itens.reduce((sum, item) => sum + (item.quantidade * item.valorUnitario), 0);
    const meiosOptions = ['Painel de preços.', 'Contratações similares.', 'Simas.', 'Fornecedores.', 'Internet.', 'Outro.'];
    const meiosAnswer = { type: 'multiOption', options: meiosOptions.map(opt => {
        const isChecked = data.meiosPesquisa.includes(opt);
        let text = opt;
        if(opt === 'Outro.') text += isChecked && data.meiosPesquisaOutro ? `: ${data.meiosPesquisaOutro}` : ': _________________';
        return { text, selected: isChecked };
    })};
    autoTable(doc, { ...tableOptions, startY: yPos, body: [
        ['6.1 - MEIOS USADOS NA PESQUISA', { content: meiosAnswer, styles: { halign: 'left' } }],
        ['6.2 - ESTIMATIVA DE PREÇO', { type: 'nestedTable', options: { head: [['Item', 'Descrição', 'Valor Unitário', 'Qtd', 'Valor Total']], body: data.itens.length > 0 ? data.itens.map((item, index) => [index + 1, item.descricao, item.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), item.quantidade, (item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ]) : [['1','','R$ 0,00','','R$ 0,00']], foot: [['', 'TOTAL', '', '', totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]], theme: 'grid', styles: { font: FONT_FAMILY, fontSize: 9, cellPadding: 1.5, lineColor: ETP_TABLE_BORDER_GRAY, lineWidth: 0.2 }, headStyles: { fillColor: ETP_PRICE_TABLE_HEADER_YELLOW, textColor: ETP_TEXT_BLACK, fontStyle: 'bold', halign: 'center' }, footStyles: { fillColor: ETP_PRICE_TABLE_HEADER_YELLOW, textColor: ETP_TEXT_BLACK, fontStyle: 'bold', halign: 'right' }, columnStyles: { 0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 'auto', halign: 'justify' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 20, halign: 'center' }, 4: {cellWidth: 30, halign: 'right'}} } }],
    ]});
    yPos = (doc as any).lastAutoTable.finalY;

    // --- SECTION 7 ---
    addEtpHeaderBar(doc, '7', 'JUSTIFICATIVA PARA O PARCELAMENTO DA SOLUÇÃO', '(art. 18, §1º, VIII, art. 40, V, b, 47, II, da Lei Federal nº 14.133/21)');
    // FIX: Explicitly type the options array to allow mixed types (with/without 'selected' property).
    const parcelamentoOptions: Array<{text: string; selected?: boolean}> = [{text: 'Sim.', selected: data.parcelamento === 'sim'}, {text: 'Não.', selected: data.parcelamento === 'nao'}];
    if (data.parcelamento === 'nao') {
        const motivosOptions = ['Objeto indivisível.', 'Perda de escala.', 'Tecnicamente inviável.', 'Economicamente inviável.', 'Aproveitamento da competitividade.', 'Outro.'];
        parcelamentoOptions.push({ text: '\nPor quê?' });
        motivosOptions.forEach(opt => {
            const isChecked = data.motivosNaoParcelamento.includes(opt);
            let text = opt;
            if(opt === 'Outro.') text += isChecked && data.motivosNaoParcelamentoOutro ? `: ${data.motivosNaoParcelamentoOutro}` : ': _________________';
            parcelamentoOptions.push({ text, selected: isChecked });
        });
    }
    const parcelamentoAnswer = { type: 'multiOption', options: parcelamentoOptions };
    autoTable(doc, { ...tableOptions, startY: yPos, body: [ [ '7.1 - A SOLUÇÃO SERÁ DIVIDIDA EM ITENS?', { content: parcelamentoAnswer, styles: { halign: 'left' } } ] ] });
    yPos = (doc as any).lastAutoTable.finalY;

    // --- SECTION 8 ---
    addEtpHeaderBar(doc, '8', 'CONTRATAÇÕES CORRELATAS OU INTERDEPENDENTES', '(art. 18, §1º, XI, da Lei Federal nº 14.133/21)');
    // FIX: Explicitly type the options array to allow mixed types (with/without 'selected' property).
    const correlatasOptions: Array<{text: string; selected?: boolean}> = [{text: 'Sim.', selected: data.contratacoesCorrelatas === 'sim'}, {text: 'Não.', selected: data.contratacoesCorrelatas === 'nao'}];
    correlatasOptions.push({ text: `\nEspecificar: ${data.contratacoesCorrelatas === 'sim' ? (data.contratacoesCorrelatasEspecificar || '_________________') : 'Não se aplica.'}`});
    const correlatasAnswer = { type: 'multiOption', options: correlatasOptions };
    autoTable(doc, { ...tableOptions, startY: yPos, body: [ [ '8.1 - HÁ CONTRATAÇÕES CORRELATAS OU INTERDEPENDENTES?', { content: correlatasAnswer, styles: { halign: 'left' }} ] ] });
    yPos = (doc as any).lastAutoTable.finalY;

    // --- SECTION 9 ---
    addEtpHeaderBar(doc, '9', 'ALINHAMENTO DA CONTRATAÇÃO COM O PLANEJAMENTO', '(art. 18, §1º, II, da Lei Federal nº 14.133/21)');
    // FIX: Explicitly type the options array to allow mixed types (with/without 'selected' property).
    const pcaOptions: Array<{text: string; selected?: boolean}> = [{text: 'Sim.', selected: data.previsaoPCA === 'sim'}, {text: 'Não.', selected: data.previsaoPCA === 'nao'}];
    if (data.previsaoPCA === 'sim') pcaOptions.push({ text: `\nEspecificar item do PCA: ${data.itemPCA || '_________________'}` });
    else pcaOptions.push({ text: `\nJustificativa e providências: ${data.justificativaPCA || '_________________'}` });
    const pcaAnswer = { type: 'multiOption', options: pcaOptions };
    autoTable(doc, { ...tableOptions, startY: yPos, body: [ [ '9.1 - HÁ PREVISÃO NO PLANO DE CONTRATAÇÕES ANUAL?', { content: pcaAnswer, styles: { halign: 'left' }} ] ] });
    yPos = (doc as any).lastAutoTable.finalY;
    
    // --- SECTION 10 ---
    addEtpHeaderBar(doc, '10', 'RESULTADOS PRETENDIDOS', '(art. 18, §1º, IX, da Lei Federal nº 14.133/21)');
    const beneficiosOptions = ['Manutenção do Funcionamento Administrativo', 'Redução de Custos', 'Aproveitamento de Recursos Humanos', 'Redução dos Riscos do Trabalho', 'Ganho de Eficiência', 'Serviço/Bem de Consumo', 'Realização de Política Pública', 'Outro.'];
    const beneficiosAnswer = { type: 'multiOption', options: beneficiosOptions.map(opt => {
        const isChecked = data.beneficios.includes(opt);
        let text = opt;
        if(opt === 'Outro.') text += isChecked && data.beneficiosOutro ? `: ${data.beneficiosOutro}` : ': _________________';
        return { text, selected: isChecked };
    })};
    autoTable(doc, { ...tableOptions, startY: yPos, body: [ [ '10.1 - QUAIS OS BENEFÍCIOS PRETENDIDOS NA CONTRATAÇÃO?', { content: beneficiosAnswer, styles: { halign: 'left' } } ] ] });
    yPos = (doc as any).lastAutoTable.finalY;
    
    // --- SECTION 11 ---
    addEtpHeaderBar(doc, '11', 'PENDÊNCIAS RELATIVAS À CONTRATAÇÃO', '(art. 18, §1º, X, da Lei Federal nº 14.133/21)');
    // FIX: Explicitly type the options array to allow mixed types (with/without 'selected' property).
    const pendenciasOptions: Array<{text: string; selected?: boolean}> = [{text: 'Sim.', selected: data.pendencias === 'sim'}, {text: 'Não.', selected: data.pendencias === 'nao'}];
    if(data.pendencias === 'sim') pendenciasOptions.push({ text: `\nEspecificar: ${data.pendenciasEspecificar || '_________________'}` });
    const pendenciasAnswer = { type: 'multiOption', options: pendenciasOptions };
    autoTable(doc, { ...tableOptions, startY: yPos, body: [ [ '11.1 - HÁ PROVIDÊNCIAS PENDENTES PARA O SUCESSO DA CONTRATAÇÃO?', { content: pendenciasAnswer, styles: { halign: 'left' }} ], [ '11.2 - QUAIS SÃO OS SETORES RESPONSÁVEIS PELAS PROVIDÊNCIAS PENDENTES?', data.pendenciasResponsaveis || 'Não informado.'] ] });
    yPos = (doc as any).lastAutoTable.finalY;

    // --- SECTION 12 ---
    addEtpHeaderBar(doc, '12', 'IMPACTOS AMBIENTAIS E MEDIDAS DE MITIGAÇÃO', '(art. 18, §1º, XII, da Lei Federal nº 14.133/21)');
    // FIX: Avoid unintentional type comparison by replacing `data.impactoAmbiental === 'sim'` with `false` in the else branch, as the type checker knows it can't be 'sim' there.
    const impactoAmbientalAnswer = data.impactoAmbiental === 'sim' ? { type: 'impactMitigation', impactos: data.impactos, medidasMitigacao: data.medidasMitigacao } : { type: 'multiOption', options: [{text: 'Sim.', selected: false}, {text: 'Não.', selected: data.impactoAmbiental === 'nao'}]};
    autoTable(doc, { ...tableOptions, startY: yPos, body: [ [ '12.1 - HÁ PREVISÃO DE IMPACTO AMBIENTAL NA CONTRATAÇÃO?', { content: impactoAmbientalAnswer, styles: { halign: 'left' }} ] ] });
    yPos = (doc as any).lastAutoTable.finalY;

    // --- SECTION 13 & SIGNATURE ---
    addEtpHeaderBar(doc, '13', 'DECLARAÇÃO DE VIABILIDADE');
    const viabilidadeAnswer = { type: 'multiOption', options: [{text: 'Sim.', selected: data.viabilidade === 'sim'}, {text: 'Não.', selected: data.viabilidade === 'nao'}]};
    autoTable(doc, { ...tableOptions, startY: yPos, body: [[ '13.1 - A CONTRATAÇÃO POSSUI VIABILIDADE TÉCNICA, SOCIOECONÔMICA E AMBIENTAL?', { content: viabilidadeAnswer, styles: { fillColor: ETP_VIABILITY_BOX_YELLOW }} ]]});
    yPos = (doc as any).lastAutoTable.finalY;
    
    checkAndAddPage(doc, 50);
    const date = new Date(data.data + 'T00:00:00');
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text(`${data.cidade} (PA), ${formattedDate}.`, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 20;
    doc.text('(Assinatura)', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text((data.nome || 'NOME DO SERVIDOR').toUpperCase(), PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text('Cargo e matrícula', PAGE_WIDTH / 2, yPos, { align: 'center' });
};


// --- ANÁLISE DE RISCO ---
const generateRiscoPdf = (doc: jsPDF, data: RiscoData) => {
    // Header
    doc.setFontSize(14);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text('ANÁLISE DE RISCOS', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 7;
    doc.setFontSize(11);
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text(`PAE Nº ${data.pae}`, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 12;
    
    if (data.riscos && data.riscos.length > 0) {
        data.riscos.forEach((risco: RiskItem, index) => {
            const tableBody = [
                ['Descrição do Risco', risco.descricao],
                ['Probabilidade', risco.probabilidade],
                ['Impacto', risco.impacto],
                ['Dano', risco.dano],
                ['Ação Preventiva', `Descrição: ${risco.prevDesc}\nResponsável: ${risco.prevResp}`],
                ['Ação Contingencial', `Descrição: ${risco.contDesc}\nResponsável: ${risco.contResp}`],
            ];
            
            checkAndAddPage(doc, 70); // Estimate height
            autoTable(doc, {
                ...commonAutoTableOptions,
                startY: yPos,
                head: [[{ content: `RISCO ${index + 1}`, colSpan: 2, styles: { halign: 'center' } }]],
                body: tableBody,
                theme: 'striped',
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
                didDrawPage: (hookData) => { yPos = hookData.cursor?.y || yPos; }
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
        });
    } else {
        addText(doc, 'Nenhum risco foi identificado.');
        yPos += 10;
    }
    
    addSignatoryOld(doc, data);
};

// --- ORÇAMENTO ---
const generateOrcamentoPdf = (doc: jsPDF, data: OrcamentoData) => {
    // 1. Header
    doc.setFontSize(14);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text('ORÇAMENTO ESTIMADO', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 7;
    doc.setFontSize(11);
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text(`PAE Nº ${data.pae}`, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 12;

    const tipoOrcamentoText = data.tipoOrcamento === 'licitacao' ? 'Licitação' : `Adesão à Ata de SRP nº ${data.numeroAta}/${data.anoAta}`;
    doc.setFontSize(10);
    doc.text(`Tipo: ${tipoOrcamentoText}`, MARGIN_LEFT, yPos);
    yPos += 10;

    // Helper function for titles
    const addOrcamentoSectionTitle = (title: string) => {
        checkAndAddPage(doc, 15);
        yPos += 4;
        const barHeight = 8;
        doc.setFillColor(ORCAMENTO_HEADER_GREEN);
        doc.rect(MARGIN_LEFT, yPos, USABLE_WIDTH, barHeight, 'F');
        doc.setTextColor(HEADER_TEXT_WHITE);
        doc.setFontSize(11);
        doc.setFont(FONT_FAMILY, 'bold');
        doc.text(title.toUpperCase(), MARGIN_LEFT + 3, yPos + barHeight - 2.5);
        yPos += barHeight + 5;
    };

    // 2. Quadro Resumo do Orçamento
    addOrcamentoSectionTitle('Quadro Resumo do Orçamento');

    const lotes: { [key: string]: OrcamentoItemGroup[] } = {};
    const ungrouped: OrcamentoItemGroup[] = [];
    data.itemGroups.forEach(item => {
      if (item.loteId) {
        if (!lotes[item.loteId]) lotes[item.loteId] = [];
        lotes[item.loteId].push(item);
      } else {
        ungrouped.push(item);
      }
    });

    const sortedLoteIds = Object.keys(lotes).sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || a, 10);
        const numB = parseInt(b.match(/\d+/)?.[0] || b, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
    });
    
    const tableBody: any[] = [];
    let grandTotal = 0;

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const processItems = (items: OrcamentoItemGroup[]) => {
        let lotTotal = 0;
        items.forEach(item => {
            const totalItem = item.estimativaUnitaria * item.quantidadeTotal;
            lotTotal += totalItem;
            tableBody.push([
                item.itemTR,
                item.descricao,
                item.unidade,
                item.quantidadeTotal,
                formatCurrency(item.estimativaUnitaria),
                formatCurrency(totalItem)
            ]);
        });
        return lotTotal;
    };

    sortedLoteIds.forEach(loteId => {
        tableBody.push([{ content: `LOTE ${loteId}`, colSpan: 6, styles: { fontStyle: 'bold', fillColor: '#f0f0f0', textColor: '#000' } }]);
        const loteTotal = processItems(lotes[loteId]);
        tableBody.push([{ content: `Subtotal do Lote ${loteId}`, colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, { content: formatCurrency(loteTotal), styles: { fontStyle: 'bold' } }]);
        grandTotal += loteTotal;
    });

    if (ungrouped.length > 0) {
        if(sortedLoteIds.length > 0) {
            tableBody.push([{ content: 'ITENS NÃO AGRUPADOS', colSpan: 6, styles: { fontStyle: 'bold', fillColor: '#f0f0f0', textColor: '#000' } }]);
        }
        const ungroupedTotal = processItems(ungrouped);
        grandTotal += ungroupedTotal;
    }
    
    autoTable(doc, {
        startY: yPos,
        head: [['Item', 'Descrição', 'Und.', 'Qtd.', 'Valor Unit. Estimado', 'Valor Total Estimado']],
        body: tableBody,
        foot: [[{ content: 'VALOR TOTAL GERAL', colSpan: 5, styles: { halign: 'right' } }, formatCurrency(grandTotal)]],
        theme: 'grid',
        styles: { font: FONT_FAMILY, fontSize: 8, cellPadding: 2, lineColor: ORCAMENTO_TABLE_BORDER_GRAY, lineWidth: 0.2 },
        headStyles: { fillColor: ORCAMENTO_TABLE_HEADER_LIGHT_GREEN, textColor: ETP_TEXT_BLACK, fontStyle: 'bold', halign: 'center' },
        footStyles: { fillColor: ORCAMENTO_TABLE_HEADER_LIGHT_GREEN, textColor: ETP_TEXT_BLACK, fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 15, halign: 'center' }, 4: { cellWidth: 30, halign: 'right' }, 5: { cellWidth: 30, halign: 'right' },
        },
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        didDrawPage: (d) => { yPos = d.cursor?.y || yPos; }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // 3. Detalhamento da Pesquisa de Preços
    addOrcamentoSectionTitle('Detalhamento da Pesquisa de Preços');

    const fontesMap: { [key: string]: string } = {
        'simas': 'Simas', 'nfe': 'Base Nacional de Notas fiscais Eletrônicas', 'pncp': 'Portal Nacional de Compras Públicas - PNCP',
        'siteEspecializado': 'Mídia especializada', 'contratacaoSimilar': 'Contratações Similares', 'direta': 'Pesquisa direta com fornecedor',
        'ata': 'Preço da Ata de SRP'
    };
    
    data.itemGroups.forEach(group => {
        const prices = data.precosEncontrados[group.id] || [];
        if (prices.length > 0) {
            checkAndAddPage(doc, 30 + prices.length * 8); // Estimate height
            
            const priceTableBody = prices.map(price => [
                fontesMap[price.source] || price.source,
                price.value,
                (data.precosIncluidos[price.id] ?? true) ? 'Sim' : 'Não'
            ]);
            
            autoTable(doc, {
                startY: yPos,
                head: [[{ content: `Item ${group.itemTR}: ${group.descricao.substring(0, 100)}${group.descricao.length > 100 ? '...' : ''}`, colSpan: 3, styles: { halign: 'left', fillColor: '#EAEAEA', textColor: '#000', lineWidth: 0.1 } }]],
                body: priceTableBody,
                columns: [ { header: 'Fonte da Pesquisa' }, { header: 'Valor Encontrado (R$)' }, { header: 'Incluído?' } ],
                theme: 'grid',
                styles: { font: FONT_FAMILY, fontSize: 8, cellPadding: 2, lineColor: ORCAMENTO_TABLE_BORDER_GRAY, lineWidth: 0.2 },
                headStyles: { fillColor: '#FFF', textColor: '#000', fontStyle: 'bold' },
                columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } },
                margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
                didDrawPage: (d) => { yPos = d.cursor?.y || yPos; }
            });
            yPos = (doc as any).lastAutoTable.finalY + 8;
        }
    });

    // 4. Metodologia e Justificativas
    addOrcamentoSectionTitle('Metodologia e Justificativas');

    const metodologiaMap = { 'menor': 'Menor preço', 'media': 'Média aritmética', 'mediana': 'Mediana' };
    let metodologiaText = data.tipoOrcamento === 'adesao_ata'
        ? 'Para a adesão à Ata de Registro de Preços, o valor estimado foi definido como o menor valor entre o preço registrado na ata e o valor de mercado, calculado a partir das demais fontes coletadas, garantindo a vantajosidade da adesão.'
        : `O valor estimado para a contratação foi calculado utilizando o critério de "${metodologiaMap[data.metodologia] || 'Não definida'}" sobre os preços válidos coletados.`;
    
    autoTable(doc, {
        startY: yPos,
        theme: 'grid',
        styles: { font: FONT_FAMILY, fontSize: 10, lineColor: ETP_TABLE_BORDER_GRAY, lineWidth: 0.2, valign: 'middle' },
        columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: ETP_QUESTION_BG_GRAY, halign: 'center' }, 1: { halign: 'justify' } },
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        body: [
            ['METODOLOGIA PARA ESTIMATIVA DE PREÇO', metodologiaText],
            ...(data.houveDescarte === 'sim' && data.justificativaDescarte ? [['JUSTIFICATIVA PARA O DESCARTE DE PREÇOS', data.justificativaDescarte]] : []),
            ...(data.justificativaAusenciaFonte ? [['JUSTIFICATIVA DA AUSÊNCIA DE PESQUISA EM FONTES PRIORITÁRIAS', data.justificativaAusenciaFonte]] : []),
            ...(data.justificativaPesquisaDireta ? [['JUSTIFICATIVA DA PESQUISA DIRETA COM FORNECEDORES', data.justificativaPesquisaDireta]] : []),
        ],
        didDrawPage: (d) => { yPos = d.cursor?.y || yPos; }
    });
    yPos = (doc as any).lastAutoTable.finalY;
    
    // 5. Signature
    checkAndAddPage(doc, 50);
    const date = new Date(data.data + 'T00:00:00');
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text(`${data.cidade} (PA), ${formattedDate}.`, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 20;
    doc.text('(Assinatura)', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text((data.assinante1Nome || 'NOME DO SERVIDOR').toUpperCase(), PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text('Servidor Responsável', PAGE_WIDTH / 2, yPos, { align: 'center' });
};


// --- MAIN EXPORT ---
export const generatePdf = (docType: DocumentType, data: any): { success: boolean; error?: string } => {
    const doc = new jsPDF();
    yPos = MARGIN_TOP; // Reset yPos for each new PDF generation

    try {
        registerMontserratFont(doc);
        setDefaultFont(doc);

        switch (docType) {
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
                throw new Error('Tipo de documento não suportado.');
        }

        doc.save(`${docType}_${data.pae || data.numeroMemo || 'documento'}.pdf`);
        return { success: true };
    } catch (error: any) {
        console.error('Erro ao gerar PDF:', error);
        return { success: false, error: error.message || 'Erro desconhecido.' };
    }
};
