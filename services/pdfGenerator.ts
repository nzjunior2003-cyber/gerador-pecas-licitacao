
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
const ETP_HEADER_BLUE = '#002060';
const ETP_TEXT_BLACK = '#000000';
const ETP_TEXT_WHITE = '#FFFFFF';
const ETP_VIABILITY_BOX_YELLOW = '#FFF2CC';
const ETP_PRICE_TABLE_HEADER_YELLOW = '#FFC000';
const ETP_TABLE_BORDER_GRAY = '#BFBFBF';


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

const addEtpFooterAndPageBreaks = (doc: jsPDF) => {
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont(FONT_FAMILY, 'normal');
        doc.setTextColor(ETP_TEXT_BLACK);
        doc.text('MANUAL DE FASE PREPARATÓRIA E DISPENSA ELETRÔNICA', PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: 'center'});
    }
}

const etpCheckAndAddPage = (doc: jsPDF, neededHeight: number) => {
    if (yPos + neededHeight > (PAGE_HEIGHT - MARGIN_BOTTOM)) {
        doc.addPage();
        yPos = MARGIN_TOP;
        return true;
    }
    return false;
};

const addEtpHeaderBar = (doc: jsPDF, number: string, title: string, legalRef: string) => {
    etpCheckAndAddPage(doc, 20);
    yPos += 6;
    doc.setFillColor(ETP_HEADER_BLUE);
    doc.rect(MARGIN_LEFT, yPos, USABLE_WIDTH, 8, 'F');
    
    doc.setFontSize(11);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setTextColor(ETP_TEXT_WHITE);
    doc.text(`${number} – ${title}`, MARGIN_LEFT + 2, yPos + 5.5);

    if(legalRef) {
        doc.setFontSize(9);
        doc.setFont(FONT_FAMILY, 'normal');
        const legalRefWidth = doc.getTextWidth(legalRef);
        doc.text(legalRef, PAGE_WIDTH - MARGIN_RIGHT - 2 - legalRefWidth, yPos + 5.5);
    }
    yPos += 14;
}

const addEtpQuestion = (doc: jsPDF, text: string) => {
    etpCheckAndAddPage(doc, 10);
    doc.setFontSize(10);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setTextColor(ETP_TEXT_BLACK);
    
    const lines = doc.splitTextToSize(text, USABLE_WIDTH);
    doc.text(lines, MARGIN_LEFT, yPos);
    yPos += lines.length * 5 + 1; // Extra space after question
};

const addEtpAnswer = (doc: jsPDF, answer: string | string[], isList: boolean = false) => {
    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        answer = "Não informado.";
    }
    
    let textToRender: string;
    if (Array.isArray(answer)) {
        textToRender = isList ? answer.map(a => `- ${a}`).join('\n') : answer.join(', ');
    } else {
        textToRender = answer;
    }
    
    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(ETP_TEXT_BLACK);
    const lines = doc.splitTextToSize(textToRender, USABLE_WIDTH);
    etpCheckAndAddPage(doc, lines.length * 6);
    doc.text(lines, MARGIN_LEFT, yPos, { align: 'justify' });
    yPos += lines.length * 5 + 4; // Extra space after answer
}

const addEtpSignatory = (doc: jsPDF, data: { cidade: string; data: string; nome: string; cargo: string; funcao: string; }) => {
    etpCheckAndAddPage(doc, 50);
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
    doc.text(`${data.cargo} e ${data.funcao || 'matrícula'}`, PAGE_WIDTH / 2, yPos, { align: 'center' });
}


const generateEtpPdf = (doc: jsPDF, data: EtpData) => {
    // --- TITLE ---
    doc.setFontSize(12);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text(`ESTUDO TÉCNICO PRELIMINAR N° ${data.numero}/${data.ano}`, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 7;
    doc.setFontSize(11);
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text(`PAE nº ${data.pae}`, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 5;
    
    // --- SECTIONS ---
    addEtpHeaderBar(doc, '1', 'DESCRIÇÃO DA NECESSIDADE', '(art. 18, §1º, I, da Lei Federal nº 14.133/21)');
    addEtpQuestion(doc, '1.1 - QUAL A NECESSIDADE A SER ATENDIDA?');
    addEtpAnswer(doc, data.necessidade);

    addEtpHeaderBar(doc, '2', 'LEVANTAMENTO DE MERCADO', '(arts. 18, §1º, V, e 44 da Lei Federal nº 14.133/21)');
    addEtpQuestion(doc, '2.1 - ONDE FORAM PESQUISADAS AS POSSÍVEIS SOLUÇÕES?');
    const fontes = data.fontesPesquisa.map(f => f === 'Outro' && data.fonteOutro ? `Outro. Especificar: ${data.fonteOutro}` : `${f}.`);
    addEtpAnswer(doc, fontes, true);
    addEtpQuestion(doc, '2.2 - JUSTIFICATIVA TÉCNICA E ECONÔMICA PARA A ESCOLHA DA MELHOR SOLUÇÃO');
    addEtpAnswer(doc, data.justificativaTecnica);
    addEtpQuestion(doc, '2.3 - HÁ RESTRIÇÃO DE FORNECEDORES?');
    addEtpAnswer(doc, data.restricaoFornecedores === 'sim' ? 'Sim.' : 'Não.');
    
    addEtpHeaderBar(doc, '3', 'DESCRIÇÃO DOS REQUISITOS DE CONTRATAÇÃO', '(art. 18, §1º, III, da Lei Federal nº 14.133/21)');
    addEtpQuestion(doc, '3.1 - QUAL O TIPO DE OBJETO?');
    const tipoObjetoMap: {[key: string]: string} = {'bem': 'Bem.', 'servico': 'Serviço.', 'locacao': 'Locação de imóvel.', 'obra': 'Obra ou serviço de engenharia.'};
    addEtpAnswer(doc, data.tipoObjeto?.map(t => tipoObjetoMap[t] || t) || [], true);
    addEtpQuestion(doc, '3.2 - QUAL A NATUREZA?');
    addEtpAnswer(doc, data.natureza === 'continuada' ? 'Continuada.' : 'Não continuada.');
    addEtpQuestion(doc, '3.3 - HÁ MONOPÓLIO?');
    addEtpAnswer(doc, data.monopolio === 'sim' ? 'Sim, apenas um único fornecedor é capaz de atender a demanda.' : 'Não, há mais de um fornecedor capaz de atender a demanda.');
    addEtpQuestion(doc, '3.4 - QUAL A VIGÊNCIA?');
    const vigenciaText = data.vigencia === 'outro' ? `Outro: ${data.vigenciaOutroNum} ${data.vigenciaOutroTipo}` : data.vigencia;
    addEtpAnswer(doc, vigenciaText);
    addEtpQuestion(doc, '3.5 - PODERÁ HAVER PRORROGAÇÃO?');
    addEtpAnswer(doc, data.prorrogacao === 'na' ? 'Não se aplica porque o prazo é indeterminado.' : `${data.prorrogacao === 'sim' ? 'Sim' : 'Não'}.`);
    addEtpQuestion(doc, '3.6 - HÁ TRANSIÇÃO COM CONTRATO ANTERIOR?');
    addEtpAnswer(doc, data.transicao === 'sim' ? `Sim. Contrato nº: ${data.transicaoContrato}, Prazo final: ${data.transicaoPrazo}` : 'Não.');
    
    addEtpQuestion(doc, '3.7 - PADRÃO MÍNIMO DE QUALIDADE');
    if (data.padraoQualidade && data.padraoQualidade.length > 0) {
        autoTable(doc, {
            startY: yPos,
            head: [['Item', 'Descrição detalhada']],
            body: data.padraoQualidade.map((item, index) => [index + 1, item.descricao]),
            theme: 'grid',
            styles: { font: FONT_FAMILY, fontSize: 9, cellPadding: 2, lineColor: ETP_TABLE_BORDER_GRAY, lineWidth: 0.2 },
            headStyles: { fillColor: '#DEEAF6', textColor: ETP_TEXT_BLACK, fontStyle: 'bold', halign: 'center' },
            columnStyles: { 0: { cellWidth: 20, halign: 'center' }, 1: { cellWidth: 'auto' } },
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
            didDrawPage: (hookData) => { yPos = hookData.cursor?.y || yPos; }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
    } else { addEtpAnswer(doc, 'Não especificado.'); }

    addEtpQuestion(doc, '3.8 - QUAIS CRITÉRIOS DE SUSTENTABILIDADE?');
    const sust = data.sustentabilidade.map(s => s === 'Outro.' && data.sustentabilidadeOutro ? `Outro. Especificar: ${data.sustentabilidadeOutro}` : s);
    addEtpAnswer(doc, sust, true);
    addEtpQuestion(doc, '3.9 - HÁ PRIORIDADE PARA AQUISIÇÃO OU CONTRATAÇÃO, CONFORME LEI Nº 12.035/2010?');
    const prioridadeTextMap = {'reciclados': 'Sim, para produtos reciclados e recicláveis.', 'sustentaveis': 'Sim, para bens, serviços e obras que considerem critérios compatíveis com padrões de consumo social e ambientalmente sustentáveis.', 'nao': 'Não.'};
    let prioridadeAnswer = prioridadeTextMap[data.prioridadeLeiTipo as keyof typeof prioridadeTextMap] || '';
    if(data.prioridadeLeiTipo === 'nao' && data.prioridadeLeiJustificativa) { prioridadeAnswer += ` Justificativa: ${data.prioridadeLeiJustificativa}`}
    addEtpAnswer(doc, prioridadeAnswer);
    addEtpQuestion(doc, '3.10 - HÁ NECESSIDADE DE TREINAMENTO?');
    addEtpAnswer(doc, data.treinamento === 'sim' ? 'Sim.' : 'Não.');
    
    addEtpHeaderBar(doc, '4', 'DESCRIÇÃO DA SOLUÇÃO', '(art. 18, §1º, VII, da Lei Federal nº 14.133/21)');
    addEtpQuestion(doc, '4.1 - O QUE SERÁ CONTRATADO?');
    addEtpAnswer(doc, data.solucaoContratacao);
    addEtpQuestion(doc, '4.2 - QUAL O PRAZO DA GARANTIA CONTRATUAL?');
    const garantiaMap = {'nao_ha': 'Não há.', '90_dias': '90 dias.', '12_meses': '12 meses.', 'outro': `Outro: ${data.garantiaOutroNum} ${data.garantiaOutroTipo}`};
    addEtpAnswer(doc, garantiaMap[data.garantiaContratual as keyof typeof garantiaMap] || '');
    addEtpQuestion(doc, '4.3 - HÁ NECESSIDADE DE ASSISTÊNCIA TÉCNICA?');
    addEtpAnswer(doc, data.assistenciaTecnica === 'sim' ? `Sim. Justificativa: (Indicar o motivo da necessidade de assistência técnica para a contratação).` : 'Não.');
    addEtpQuestion(doc, '4.4 - HÁ NECESSIDADE DE MANUTENÇÃO?');
    addEtpAnswer(doc, data.manutencao === 'sim' ? 'Sim. Descrever solução: (Contrato de manutenção).' : 'Não.');
    
    addEtpHeaderBar(doc, '5', 'DIMENSIONAMENTO DO OBJETO', '(art. 18, §1º, IV, da Lei Federal nº 14.133/21)');
    addEtpQuestion(doc, '5.1 - COMO SE OBTEVE O QUANTITATIVO ESTIMADO?');
    const metodo = data.metodoQuantitativo.map(m => m === 'Outro.' && data.metodoOutro ? `Outro. Especificar: ${data.metodoOutro}` : m);
    addEtpAnswer(doc, metodo, true);
    addEtpQuestion(doc, '5.2 - DESCRIÇÃO DO QUANTITATIVO');
    addEtpAnswer(doc, data.descricaoQuantitativo);
    
    addEtpQuestion(doc, '5.3 - ESPECIFICAÇÃO');
     if (data.itens && data.itens.length > 0) {
        autoTable(doc, {
            startY: yPos,
            head: [['Item', 'Descrição', 'Und', 'Qtd']],
            body: data.itens.map((item, index) => [index + 1, item.descricao, item.unidade, item.quantidade]),
            theme: 'grid', styles: { font: FONT_FAMILY, fontSize: 9, cellPadding: 2, lineColor: ETP_TABLE_BORDER_GRAY, lineWidth: 0.2 },
            headStyles: { fillColor: '#DEEAF6', textColor: ETP_TEXT_BLACK, fontStyle: 'bold', halign: 'center' },
            columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 } },
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT }, didDrawPage: (d) => { yPos = d.cursor?.y || yPos; }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
    } else { addEtpAnswer(doc, 'Não especificado.'); }

    addEtpHeaderBar(doc, '6', 'ESTIMATIVA DO VALOR DA CONTRATAÇÃO', '(art. 18, §1º, VI, da Lei Federal nº 14.133/21)');
    addEtpQuestion(doc, '6.1 - MEIOS USADOS NA PESQUISA');
    const meios = data.meiosPesquisa.map(m => m === 'Outro.' && data.meiosPesquisaOutro ? `Outro. Especificar: ${data.meiosPesquisaOutro}` : `${m}.`);
    addEtpAnswer(doc, meios, true);
    addEtpQuestion(doc, '6.2 - ESTIMATIVA DE PREÇO');
    if (data.itens && data.itens.length > 0) {
        const totalGeral = data.itens.reduce((sum, item) => sum + (item.quantidade * item.valorUnitario), 0);
        autoTable(doc, {
            startY: yPos,
            head: [['Item', 'Descrição', 'Valor Unitário', 'Qtd', 'Valor Total']],
            body: data.itens.map((item, index) => [index + 1, item.descricao, item.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), item.quantidade, (item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ]),
            foot: [['', 'TOTAL', '', '', totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]],
            theme: 'grid', styles: { font: FONT_FAMILY, fontSize: 9, cellPadding: 2, lineColor: ETP_TABLE_BORDER_GRAY, lineWidth: 0.2 },
            headStyles: { fillColor: ETP_PRICE_TABLE_HEADER_YELLOW, textColor: ETP_TEXT_BLACK, fontStyle: 'bold', halign: 'center' },
            footStyles: { fillColor: ETP_PRICE_TABLE_HEADER_YELLOW, textColor: ETP_TEXT_BLACK, fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 30 }, 3: { cellWidth: 20 }, 4: {cellWidth: 30}},
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT }, didDrawPage: (d) => { yPos = d.cursor?.y || yPos; }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
    } else { addEtpAnswer(doc, 'Não especificado.'); }
    
    addEtpHeaderBar(doc, '7', 'JUSTIFICATIVA PARA O PARCELAMENTO DA SOLUÇÃO', '(art. 18, §1º, VIII, art. 40, V, b, 47, II, da Lei Federal nº 14.133/21)');
    addEtpQuestion(doc, '7.1 - A SOLUÇÃO SERÁ DIVIDIDA EM ITENS?');
    if (data.parcelamento === 'nao') {
        const motivos = data.motivosNaoParcelamento.map(m => m === 'Outro.' && data.motivosNaoParcelamentoOutro ? `Outro. Especificar: ${data.motivosNaoParcelamentoOutro}` : `${m}`);
        addEtpAnswer(doc, [`Não. Por quê?`, ...motivos], true);
    } else { addEtpAnswer(doc, 'Sim.'); }

    addEtpHeaderBar(doc, '8', 'CONTRATAÇÕES CORRELATAS OU INTERDEPENDENTES', '(art. 18, §1º, XI, da Lei Federal nº 14.133/21)');
    addEtpQuestion(doc, '8.1 - HÁ CONTRATAÇÕES CORRELATAS OU INTERDEPENDENTES?');
    addEtpAnswer(doc, data.contratacoesCorrelatas === 'sim' ? `Sim. Especificar: ${data.contratacoesCorrelatasEspecificar}` : 'Não.');
    
    addEtpHeaderBar(doc, '9', 'ALINHAMENTO DA CONTRATAÇÃO COM O PLANEJAMENTO', '(art. 18, §1º, II, da Lei Federal nº 14.133/21)');
    addEtpQuestion(doc, '9.1 - HÁ PREVISÃO NO PLANO DE CONTRATAÇÕES ANUAL?');
    addEtpAnswer(doc, data.previsaoPCA === 'sim' ? `Sim. Especificar item do PCA: ${data.itemPCA}` : `Não. Justificativa e providências: ${data.justificativaPCA}`);

    addEtpHeaderBar(doc, '10', 'RESULTADOS PRETENDIDOS', '(art. 18, §1º, IX, da Lei Federal nº 14.133/21)');
    addEtpQuestion(doc, '10.1 - QUAIS OS BENEFÍCIOS PRETENDIDOS NA CONTRATAÇÃO?');
    const beneficios = data.beneficios.map(b => b === 'Outro.' && data.beneficiosOutro ? `Outro. Especificar: ${data.beneficiosOutro}` : b);
    addEtpAnswer(doc, beneficios, true);
    
    addEtpHeaderBar(doc, '11', 'PENDÊNCIAS RELATIVAS À CONTRATAÇÃO', '(art. 18, §1º, X, da Lei Federal nº 14.133/21)');
    addEtpQuestion(doc, '11.1 - HÁ PROVIDÊNCIAS PENDENTES PARA O SUCESSO DA CONTRATAÇÃO?');
    addEtpAnswer(doc, data.pendencias === 'sim' ? `Sim. Especificar: ${data.pendenciasEspecificar}` : 'Não.');
    addEtpQuestion(doc, '11.2 - QUAIS SÃO OS SETORES RESPONSÁVEIS PELAS PROVIDÊNCIAS PENDENTES?');
    addEtpAnswer(doc, data.pendenciasResponsaveis);

    addEtpHeaderBar(doc, '12', 'IMPACTOS AMBIENTAIS E MEDIDAS DE MITIGAÇÃO', '(art. 18, §1º, XII, da Lei Federal nº 14.133/21)');
    addEtpQuestion(doc, '12.1 - HÁ PREVISÃO DE IMPACTO AMBIENTAL NA CONTRATAÇÃO?');
    if(data.impactoAmbiental === 'sim') {
        autoTable(doc, {
            startY: yPos,
            body: [
                [{content: 'Sim.', styles: {halign: 'center'}}],
                [{content: `Impactos: ${data.impactos}`, styles: {fillColor: '#F8CBAD'}}],
                [{content: `Medidas de mitigação: ${data.medidasMitigacao}`, styles: {fillColor: '#BDD7EE'}}]
            ],
            theme: 'grid', styles: { font: FONT_FAMILY, fontSize: 9, cellPadding: 2, lineColor: ETP_TABLE_BORDER_GRAY, lineWidth: 0.2 },
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT }, didDrawPage: (d) => { yPos = d.cursor?.y || yPos; }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
    } else { addEtpAnswer(doc, 'Não.'); }

    addEtpQuestion(doc, '13.1 - A CONTRATAÇÃO POSSUI VIABILIDADE TÉCNICA, SOCIOECONÔMICA E AMBIENTAL?');
    doc.setFillColor(ETP_VIABILITY_BOX_YELLOW);
    const answer = data.viabilidade === 'sim' ? 'Sim.' : 'Não.';
    const answerHeight = doc.splitTextToSize(answer, USABLE_WIDTH).length * 5 + 4;
    doc.rect(MARGIN_LEFT, yPos, USABLE_WIDTH, answerHeight, 'F');
    addEtpAnswer(doc, answer);
    
    addEtpSignatory(doc, data);
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
    // Implementação futura do PDF de Orçamento
    doc.text("PDF de Orçamento - Em desenvolvimento", MARGIN_LEFT, yPos);
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
                addEtpFooterAndPageBreaks(doc);
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
