
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

// ETP-specific Style Constants
const ETP_FONT_SIZES = {
    TITLE: 14,
    SUBTITLE: 12,
    SECTION_HEADER: 11,
    LEGAL_REF: 9,
    QUESTION: 10,
    TEXT: 10,
    TABLE_HEADER: 9,
    TABLE_BODY: 9,
    FOOTER: 9,
};

const ETP_COLORS = {
    TEXT_PRIMARY: '#000000',
    TEXT_SECONDARY: '#555555',
    SECTION_HEADER_BG: '#EAEAEA',
    TABLE_HEADER_BG: '#444444',
    TABLE_HEADER_TEXT: '#FFFFFF',
    TABLE_ROW_ALT_BG: '#F5F5F5',
};


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

const addPageNumbers = (doc: jsPDF) => {
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(ETP_FONT_SIZES.FOOTER);
        doc.setFont(FONT_FAMILY, 'normal');
        doc.setTextColor(ETP_COLORS.TEXT_SECONDARY);
        const text = `Página ${i} de ${totalPages}`;
        doc.text(text, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 10, { align: 'right'});

        if (i > 1) { // Add header to all pages except the first
            doc.setFontSize(ETP_FONT_SIZES.LEGAL_REF);
            doc.text('Estudo Técnico Preliminar', MARGIN_LEFT, 12);
            doc.text(`PAE Nº ${doc.internal.pdflib.page.userObjects.pae || ''}`, PAGE_WIDTH - MARGIN_RIGHT, 12, { align: 'right' });
            doc.setDrawColor(ETP_COLORS.TEXT_SECONDARY);
            doc.line(MARGIN_LEFT, 15, PAGE_WIDTH - MARGIN_RIGHT, 15);
        }
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

const addEtpSectionHeader = (doc: jsPDF, number: string, title: string, legalRef: string) => {
    etpCheckAndAddPage(doc, 20);
    yPos += 8;
    doc.setFontSize(ETP_FONT_SIZES.SECTION_HEADER);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFillColor(ETP_COLORS.SECTION_HEADER_BG);
    doc.rect(MARGIN_LEFT, yPos, USABLE_WIDTH, 8, 'F');
    doc.setTextColor(ETP_COLORS.TEXT_PRIMARY);
    doc.text(`${number} – ${title.toUpperCase()}`, MARGIN_LEFT + 2, yPos + 6);

    doc.setFontSize(ETP_FONT_SIZES.LEGAL_REF);
    doc.setFont(FONT_FAMILY, 'normal');
    doc.setTextColor(ETP_COLORS.TEXT_SECONDARY);
    doc.text(legalRef, PAGE_WIDTH - MARGIN_RIGHT - 2, yPos + 6, { align: 'right' });
    
    yPos += 14;
}

const addEtpQuestionAnswer = (doc: jsPDF, question: string, answer: string | string[], options: {isList?: boolean} = {}) => {
    etpCheckAndAddPage(doc, 10);
    doc.setFontSize(ETP_FONT_SIZES.QUESTION);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setTextColor(ETP_COLORS.TEXT_PRIMARY);
    
    const questionLines = doc.splitTextToSize(question, USABLE_WIDTH);
    doc.text(questionLines, MARGIN_LEFT, yPos);
    yPos += questionLines.length * 5;

    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(ETP_FONT_SIZES.TEXT);
    const answerText = Array.isArray(answer) ? answer.join(', ') : answer;
    const lines = doc.splitTextToSize(answerText || "Não informado.", USABLE_WIDTH - 5);
    etpCheckAndAddPage(doc, lines.length * 6);
    doc.text(lines, MARGIN_LEFT + 5, yPos, { align: 'justify' });
    yPos += lines.length * 5 + 4;
};

const addEtpSignatory = (doc: jsPDF, data: { cidade: string; data: string; nome: string; cargo: string; funcao: string; }) => {
    etpCheckAndAddPage(doc, 50);
    const date = new Date(data.data + 'T00:00:00');
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);

    yPos += 15;
    doc.setFontSize(ETP_FONT_SIZES.TEXT);
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text(`${data.cidade} (PA), ${formattedDate}.`, PAGE_WIDTH - MARGIN_RIGHT, yPos, { align: 'right' });
    yPos += 30;

    const signatureX = PAGE_WIDTH / 2;
    doc.text('________________________________', signatureX, yPos, { align: 'center' });
    yPos += 6;
    doc.setFontSize(ETP_FONT_SIZES.TEXT);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text(data.nome.toUpperCase(), signatureX, yPos, { align: 'center' });
    yPos += 5;
    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(ETP_FONT_SIZES.TABLE_BODY);
    doc.text(data.cargo, signatureX, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`Função: ${data.funcao}`, signatureX, yPos, { align: 'center' });
}


const generateEtpPdf = (doc: jsPDF, data: EtpData) => {
    doc.internal.pdflib.page.userObjects.pae = data.pae; // Store PAE for header
    // --- TITLE ---
    doc.setFontSize(ETP_FONT_SIZES.TITLE);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text('ESTUDO TÉCNICO PRELIMINAR (ETP)', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(ETP_FONT_SIZES.SUBTITLE);
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text(`PAE Nº ${data.pae}`, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // --- SECTIONS ---
    addEtpSectionHeader(doc, '1', 'DESCRIÇÃO DA NECESSIDADE', '(art. 18, §1º, I, da Lei Federal nº 14.133/21)');
    addEtpQuestionAnswer(doc, '1.1. Necessidade a ser atendida:', data.necessidade);

    addEtpSectionHeader(doc, '2', 'LEVANTAMENTO DE MERCADO', '(arts. 18, §1º, V, e 44 da Lei Federal nº 14.133/21)');
    addEtpQuestionAnswer(doc, '2.1. Fontes pesquisadas:', `${data.fontesPesquisa?.join(', ')}${data.fonteOutro ? ` (Outro: ${data.fonteOutro})` : ''}.`);
    addEtpQuestionAnswer(doc, '2.2. Justificativa técnica e econômica:', data.justificativaTecnica);
    addEtpQuestionAnswer(doc, '2.3. Restrição de fornecedores:', data.restricaoFornecedores === 'sim' ? 'Sim' : 'Não');
    
    addEtpSectionHeader(doc, '3', 'DESCRIÇÃO DOS REQUISITOS DE CONTRATAÇÃO', '(art. 18, §1º, III, da Lei Federal nº 14.133/21)');
    addEtpQuestionAnswer(doc, '3.1. Tipo de objeto:', data.tipoObjeto?.join(', '));
    addEtpQuestionAnswer(doc, '3.2. Natureza:', data.natureza);
    addEtpQuestionAnswer(doc, '3.3. Monopólio:', data.monopolio);
    const vigenciaText = data.vigencia === 'outro' ? `${data.vigenciaOutroNum} ${data.vigenciaOutroTipo}` : data.vigencia;
    addEtpQuestionAnswer(doc, '3.4. Vigência:', vigenciaText);
    addEtpQuestionAnswer(doc, '3.5. Prorrogação:', data.prorrogacao);
    addEtpQuestionAnswer(doc, '3.6. Transição Contratual:', data.transicao === 'sim' ? `Sim. Contrato: ${data.transicaoContrato}, Prazo: ${data.transicaoPrazo}` : 'Não');
    addEtpQuestionAnswer(doc, '3.7. Padrão Mínimo de Qualidade:', data.padraoQualidade?.map(item => `- ${item.descricao}`) || []);
    addEtpQuestionAnswer(doc, '3.8. Critérios de sustentabilidade:', data.sustentabilidade?.length > 0 ? data.sustentabilidade.map(s => `- ${s}${s.includes('Outro') && data.sustentabilidadeOutro ? ` (${data.sustentabilidadeOutro})` : ''}`) : ["Não se aplica."]);
    
    const prioridadeText = data.prioridadeLeiTipo === 'reciclados' ? 'Sim, para produtos reciclados e recicláveis.' 
        : data.prioridadeLeiTipo === 'sustentaveis' ? 'Sim, para bens, serviços e obras que considerem critérios compatíveis com padrões de consumo social e ambientalmente sustentáveis.' 
        : 'Não.';
    addEtpQuestionAnswer(doc, '3.9. Prioridade (Lei nº 12.035/2010):', data.prioridadeLeiTipo === 'nao' && data.prioridadeLeiJustificativa ? `${prioridadeText} Justificativa: ${data.prioridadeLeiJustificativa}` : prioridadeText);
    addEtpQuestionAnswer(doc, '3.10. Necessidade de treinamento:', data.treinamento);
    
    addEtpSectionHeader(doc, '4', 'DESCRIÇÃO DA SOLUÇÃO', '(art. 18, §1º, VII, da Lei Federal nº 14.133/21)');
    addEtpQuestionAnswer(doc, '4.1. O que será contratado?', data.solucaoContratacao);
    let garantiaText = '';
    switch(data.garantiaContratual) {
        case 'nao_ha': garantiaText = 'Não há.'; break;
        case '90_dias': garantiaText = '90 dias.'; break;
        case '12_meses': garantiaText = '12 meses.'; break;
        case 'outro': garantiaText = `Outro: ${data.garantiaOutroNum} ${data.garantiaOutroTipo}`; break;
        default: garantiaText = 'Não informado.';
    }
    addEtpQuestionAnswer(doc, '4.2. Prazo da garantia contratual?', garantiaText);
    addEtpQuestionAnswer(doc, '4.3. Necessidade de assistência técnica?', data.assistenciaTecnica);
    addEtpQuestionAnswer(doc, '4.4. Necessidade de manutenção?', data.manutencao);
    
    addEtpSectionHeader(doc, '5', 'DIMENSIONAMENTO DO OBJETO', '(art. 18, §1º, IV, da Lei Federal nº 14.133/21)');
    addEtpQuestionAnswer(doc, '5.1. Método para obter o quantitativo:', data.metodoQuantitativo.map(s => `- ${s}${s.includes('Outro') && data.metodoOutro ? ` (${data.metodoOutro})` : ''}`));
    addEtpQuestionAnswer(doc, '5.2. Descrição do Quantitativo:', data.descricaoQuantitativo);
    
    addEtpSectionHeader(doc, '6', 'ESTIMATIVA DO VALOR DA CONTRATAÇÃO', '(art. 18, §1º, VI, da Lei Federal nº 14.133/21)');
    addEtpQuestionAnswer(doc, '6.1. Meios usados na pesquisa:', data.meiosPesquisa.map(s => `- ${s}${s.includes('Outro') && data.meiosPesquisaOutro ? ` (${data.meiosPesquisaOutro})` : ''}`));
    yPos += 2;
    // Tabela de itens
    if (data.itens && data.itens.length > 0) {
        const body = data.itens.map((item, index) => [
            index + 1,
            item.descricao,
            item.unidade,
            item.quantidade,
            item.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            (item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        ]);
        const totalGeral = data.itens.reduce((sum, item) => sum + (item.quantidade * item.valorUnitario), 0);
        
        etpCheckAndAddPage(doc, data.itens.length * 10 + 20);
        autoTable(doc, {
            startY: yPos,
            head: [['Item', 'Descrição', 'Unidade', 'Qtd', 'Valor Unit.', 'Valor Total']],
            body: body,
            foot: [['Total Geral', '', '', '', '', totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]],
            theme: 'striped',
            styles: { font: FONT_FAMILY, fontSize: ETP_FONT_SIZES.TABLE_BODY, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: ETP_COLORS.TABLE_HEADER_BG, textColor: ETP_COLORS.TABLE_HEADER_TEXT, fontStyle: 'bold', fontSize: ETP_FONT_SIZES.TABLE_HEADER, halign: 'center' },
            footStyles: { fillColor: ETP_COLORS.TABLE_HEADER_BG, textColor: ETP_COLORS.TABLE_HEADER_TEXT, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 15, halign: 'center' },
                4: { cellWidth: 25, halign: 'right' },
                5: { cellWidth: 25, halign: 'right' }
            },
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
            didDrawPage: (hookData) => { yPos = hookData.cursor?.y || yPos; }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    addEtpSectionHeader(doc, '7', 'JUSTIFICATIVA PARA O PARCELAMENTO DA SOLUÇÃO', '(art. 18, §1º, VIII, art. 40, V, b, 47, II, da Lei Federal nº 14.133/21)');
    addEtpQuestionAnswer(doc, '7.1. A solução será dividida em itens?', data.parcelamento === 'nao' ? `Não. Motivos: ${data.motivosNaoParcelamento.join(', ')}${data.motivosNaoParcelamentoOutro ? ` (Outro: ${data.motivosNaoParcelamentoOutro})` : ''}.` : 'Sim.');

    addEtpSectionHeader(doc, '8', 'CONTRATAÇÕES CORRELATAS OU INTERDEPENDENTES', '(art. 18, §1º, XI, da Lei Federal nº 14.133/21)');
    addEtpQuestionAnswer(doc, '8.1. Há contratações correlatas ou interdependentes?', data.contratacoesCorrelatas === 'sim' ? `Sim. Especificação: ${data.contratacoesCorrelatasEspecificar}` : 'Não.');
    
    addEtpSectionHeader(doc, '9', 'ALINHAMENTO DA CONTRATAÇÃO COM O PLANEJAMENTO', '(art. 18, §1º, II, da Lei Federal nº 14.133/21)');
    addEtpQuestionAnswer(doc, '9.1. Previsão no plano de contratações anual?', data.previsaoPCA === 'sim' ? `Sim. Item do PCA: ${data.itemPCA}` : `Não. Justificativa: ${data.justificativaPCA}`);

    addEtpSectionHeader(doc, '10', 'RESULTADOS PRETENDIDOS', '(art. 18, §1º, IX, da Lei Federal nº 14.133/21)');
    addEtpQuestionAnswer(doc, '10.1. Benefícios pretendidos:', data.beneficios.map(s => `- ${s}${s.includes('Outro') && data.beneficiosOutro ? ` (${data.beneficiosOutro})` : ''}`));
    
    addEtpSectionHeader(doc, '11', 'PENDÊNCIAS RELATIVAS À CONTRATAÇÃO', '(art. 18, §1º, X, da Lei Federal nº 14.133/21)');
    addEtpQuestionAnswer(doc, '11.1. Providências pendentes?', data.pendencias === 'sim' ? `Sim. Especificação: ${data.pendenciasEspecificar}` : 'Não.');
    addEtpQuestionAnswer(doc, '11.2. Setores responsáveis:', data.pendenciasResponsaveis);

    addEtpSectionHeader(doc, '12', 'IMPACTOS AMBIENTAIS E MEDIDAS DE MITIGAÇÃO', '(art. 18, §1º, XII, da Lei Federal nº 14.133/21)');
    addEtpQuestionAnswer(doc, '12.1. Previsão de impacto ambiental?', data.impactoAmbiental === 'sim' ? `Sim. Impactos: ${data.impactos}. Medidas de mitigação: ${data.medidasMitigacao}` : 'Não.');
    
    addEtpSectionHeader(doc, '13', 'DECLARAÇÃO DE VIABILIDADE', '');
    addEtpQuestionAnswer(doc, '13.1. Viabilidade da contratação:', data.viabilidade === 'sim' ? 'Declaro que a contratação é viável.' : 'Declaro que a contratação é inviável.');
    
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
                addPageNumbers(doc); // ETP has special page numbering
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
