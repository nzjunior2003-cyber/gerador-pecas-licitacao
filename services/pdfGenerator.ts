
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
    }
};

const addHeader = (doc: jsPDF, title: string, subtitle?: string) => {
    doc.setFontSize(14);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text(title.toUpperCase(), PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 7;
    if (subtitle) {
        doc.setFontSize(11);
        doc.setFont(FONT_FAMILY, 'normal');
        doc.text(subtitle, PAGE_WIDTH / 2, yPos, { align: 'center' });
        yPos += 8;
    }
    yPos += 5; // Extra space after header
};

const addSectionTitle = (doc: jsPDF, title: string) => {
    checkAndAddPage(doc, 20);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(11);
    doc.text(title, MARGIN_LEFT, yPos);
    yPos += 8;
};

const addText = (doc: jsPDF, text: string, options: { isBold?: boolean, indent?: number } = {}) => {
    const { isBold = false, indent = 0 } = options;
    const effectiveWidth = USABLE_WIDTH - indent;
    const lines = doc.splitTextToSize(text || 'Não informado.', effectiveWidth);
    
    checkAndAddPage(doc, lines.length * 5);

    doc.setFont(FONT_FAMILY, isBold ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.text(lines, MARGIN_LEFT + indent, yPos);
    yPos += lines.length * 5; 
};

const addSignatory = (doc: jsPDF, data: { cidade: string; data: string; nome: string; cargo: string; funcao: string; }) => {
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
    theme: 'grid',
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
const generateEtpPdf = (doc: jsPDF, data: EtpData) => {
    addHeader(doc, 'ESTUDO TÉCNICO PRELIMINAR (ETP)', `PAE Nº ${data.pae}`);

    const sections = [
        { title: '1. DESCRIÇÃO DA NECESSIDADE', content: data.necessidade },
        { title: '2. LEVANTAMENTO DE MERCADO', content: `Fontes pesquisadas: ${data.fontesPesquisa.join(', ')}${data.fonteOutro ? ` (Outro: ${data.fonteOutro})` : ''}.\n\nJustificativa técnica e econômica: ${data.justificativaTecnica}\n\nRestrição de fornecedores: ${data.restricaoFornecedores === 'sim' ? 'Sim' : 'Não'}` },
        { title: '7. JUSTIFICATIVA PARA O PARCELAMENTO OU NÃO', content: data.justificativaParcelamento },
        { title: '8. RESULTADOS PRETENDIDOS', content: data.resultadosPretendidos },
        { title: '9. PROVIDÊNCIAS A SEREM ADOTADAS', content: data.providencias },
        { title: '10. POSSÍVEIS IMPACTOS AMBIENTAIS', content: data.impactosAmbientais },
        { title: '11. CONTRATAÇÕES CORRELATAS E/OU INTERDEPENDENTES', content: data.contratacoesCorrelatas },
    ];
    
    sections.forEach(sec => {
        addSectionTitle(doc, sec.title);
        addText(doc, sec.content);
        yPos += 5;
    });

    // Detailed Sections
    addSectionTitle(doc, '3. REQUISITOS DA CONTRATAÇÃO');
    addText(doc, `Tipo de objeto: ${data.tipoObjeto.join(', ')}`);
    addText(doc, `Natureza: ${data.natureza}`);
    addText(doc, `Monopólio: ${data.monopolio}`);
    let vigenciaText = data.vigencia === 'outro' ? `${data.vigenciaOutroNum} ${data.vigenciaOutroTipo}` : data.vigencia;
    addText(doc, `Vigência: ${vigenciaText}`);
    addText(doc, `Prorrogação: ${data.prorrogacao}`);
    addText(doc, `Transição Contratual: ${data.transicao}`);
    if(data.transicao === 'sim') addText(doc, `Contrato: ${data.transicaoContrato}, Prazo: ${data.transicaoPrazo}`);
    
    addText(doc, 'Padrão Mínimo de Qualidade:', { isBold: true });
    data.padraoQualidade.forEach((item: EtpQualidadeItem) => addText(doc, `- ${item.descricao}`, { indent: 5 }));
    yPos += 5;

    addSectionTitle(doc, '4. DESCRIÇÃO DA SOLUÇÃO COMO UM TODO');
    addText(doc, data.solucaoContratacao);
    yPos += 5;

    addSectionTitle(doc, '5. DIMENSIONAMENTO DO OBJETO');
    addText(doc, `Método para estimar quantidades: ${data.metodoQuantitativo.join(', ')}${data.metodoOutro ? ` (Outro: ${data.metodoOutro})` : ''}`);
    addText(doc, `Descrição do Quantitativo: ${data.descricaoQuantitativo}`);
    yPos += 5;
    
    autoTable(doc, {
        ...commonAutoTableOptions,
        startY: yPos,
        head: [['Item', 'Descrição', 'Un.', 'Qtd.', 'Valor Unit. (R$)', 'Valor Total (R$)']],
        body: data.itens.map((item: EtpItem, i) => [
            i + 1,
            item.descricao,
            item.unidade,
            item.quantidade,
            item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            (item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        ]),
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    addSectionTitle(doc, '12. DECLARAÇÃO DE VIABILIDADE');
    addText(doc, `A contratação possui viabilidade: ${data.viabilidade === 'sim' ? 'Sim' : 'Não'}`);
    yPos += 10;
    
    addSignatory(doc, data);
};

// --- RISCO ---
const generateRiscoPdf = (doc: jsPDF, data: RiscoData) => {
    addHeader(doc, 'ANÁLISE DE RISCO', `PAE Nº ${data.pae}`);
    
    const body = data.riscos.flatMap((risco: RiskItem, index: number) => [
        [{ content: `Risco ${index + 1}: ${risco.descricao}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: '#EAEAEA' } }],
        ['Probabilidade', risco.probabilidade],
        ['Impacto', risco.impacto],
        ['Dano', risco.dano],
        ['Ação Preventiva', `Descrição: ${risco.prevDesc}\nResponsável: ${risco.prevResp}`],
        ['Ação Contingencial', `Descrição: ${risco.contDesc}\nResponsável: ${risco.contResp}`],
    ]);
    
    autoTable(doc, {
        ...commonAutoTableOptions,
        startY: yPos,
        head: [['CATEGORIA', 'DESCRIÇÃO']],
        body: body,
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    addSignatory(doc, data);
};

// --- ORCAMENTO ---
const generateOrcamentoPdf = (doc: jsPDF, data: OrcamentoData) => {
    addHeader(doc, 'ORÇAMENTO ESTIMADO / PESQUISA DE PREÇO', `PAE Nº ${data.pae}`);

    addSectionTitle(doc, '1. DADOS GERAIS');
    const tipo = data.tipoOrcamento === 'licitacao' ? `Licitação (${data.modalidadeLicitacao})` : `Adesão à Ata de SRP (Nº ${data.numeroAta}/${data.anoAta})`;
    addText(doc, `Tipo: ${tipo}`);
    yPos += 5;
    
    addSectionTitle(doc, '2. ITENS E VALORES ESTIMADOS');
    const itemBody = data.itemGroups.map((group: OrcamentoItemGroup) => [
        group.itemTR,
        group.loteId ? `Lote ${group.loteId}` : '-',
        group.descricao,
        group.unidade,
        group.quantidadeTotal,
        group.estimativaUnitaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        (group.estimativaUnitaria * group.quantidadeTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    ]);
    autoTable(doc, {
        ...commonAutoTableOptions,
        startY: yPos,
        head: [['Item TR', 'Lote', 'Descrição', 'Un.', 'Qtd.', 'Valor Unit. Est.', 'Valor Total Est.']],
        body: itemBody,
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    addSectionTitle(doc, '3. FONTES CONSULTADAS E METODOLOGIA');
    const fontes = data.fontesPesquisa.join(', ');
    addText(doc, `Fontes: ${fontes}.`);
    addText(doc, `Metodologia: ${data.metodologia}.`);
    yPos += 5;

    addSectionTitle(doc, '4. JUSTIFICATIVAS');
    addText(doc, 'Houve descarte de preço?', { isBold: true });
    addText(doc, data.houveDescarte === 'sim' ? `Sim. Justificativa: ${data.justificativaDescarte}` : 'Não.', { indent: 5 });
    yPos += 10;
    
    checkAndAddPage(doc, 40);
    const date = new Date(data.data + 'T00:00:00');
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    addText(doc, `${data.cidade} (PA), ${formattedDate}.`);
    yPos += 30;

    checkAndAddPage(doc, 20);
    addText(doc, data.assinante1Nome, { isBold: true });
    yPos -= 2;
    addText(doc, 'Auxiliar Administrativo');
    addText(doc, 'VOL. CIVIL');
};

// --- MAIN EXPORTED FUNCTION ---
export const generatePdf = (docType: DocumentType, data: any): { success: boolean; error?: string } => {
    try {
        const doc = new jsPDF();
        registerMontserratFont(doc);
        setDefaultFont(doc);
        yPos = MARGIN_TOP;

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
                // Silently fail for unimplemented types
                if (docType === DocumentType.TR_BENS || docType === DocumentType.TR_SERVICOS) {
                    throw new Error('Geração de PDF para Termo de Referência ainda não implementada.');
                }
                throw new Error('Tipo de documento não suportado para geração de PDF.');
        }

        const fileName = `${docType.toUpperCase()}_${data.pae || data.numeroMemo || 'doc'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        return { success: true };
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
};