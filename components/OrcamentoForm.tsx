
import React, { useEffect, useState, useMemo } from 'react';
import { OrcamentoData, OrcamentoItemGroup, OrcamentoPrice, OrcamentoFornecedor } from '../types';
import { AiAssistant } from './AiAssistant';

interface OrcamentoFormProps {
  data: OrcamentoData;
  setData: React.Dispatch<React.SetStateAction<OrcamentoData>>;
}

const Section: React.FC<{ title: string, children: React.ReactNode, instruction?: string }> = ({ title, children, instruction }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 dark:bg-gray-700/50 dark:border-gray-600">
        <h2 className="text-xl font-bold text-cbmpa-red mb-4 pb-2 border-b-2 border-cbmpa-red">{title}</h2>
        {instruction && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">{instruction}</p>}
        {children}
    </div>
);

const Field: React.FC<{ label: string, required?: boolean, children: React.ReactNode, note?: string }> = ({ label, required, children, note }) => (
    <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{note}</p>}
    </div>
);

const RadioGroup: React.FC<{ name: keyof OrcamentoData, value: string, options: {val: string, label: string}[], onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ name, value, options, onChange }) => (
    <div className="flex flex-col gap-y-2">
        {options.map(opt => (
            <div key={opt.val} className="flex items-center">
                <input type="radio" id={`${name}-${opt.val}`} name={name} value={opt.val} checked={value === opt.val} onChange={onChange} className="mr-2 h-4 w-4"/>
                <label htmlFor={`${name}-${opt.val}`} className="dark:text-gray-300">{opt.label}</label>
            </div>
        ))}
    </div>
);

const parseCurrency = (value: string | undefined): number | null => {
  if (!value) return null;
  const num = parseFloat(
    value
      .toString()
      .replace(/[^\d,.-]/g, '') 
      .replace(/\./g, '')       
      .replace(',', '.')       
  );
  return isNaN(num) ? null : num;
};

const calculateEstimate = (prices: (string | undefined)[], methodology: 'menor' | 'media' | 'mediana' | ''): number => {
  const validPrices = prices.map(parseCurrency).filter((p): p is number => p !== null && p > 0);
  
  if (validPrices.length === 0) return 0;

  switch (methodology) {
    case 'menor':
      return Math.min(...validPrices);
    case 'media':
      const sum = validPrices.reduce((a, b) => a + b, 0);
      return sum / validPrices.length;
    case 'mediana':
      const sorted = [...validPrices].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    default:
      return 0;
  }
};

const fontesPairs: ({ val: string; label: string; }[][]) = [
    [
        { val: 'simas', label: 'Simas' },
        { val: 'nfe', label: 'Base Nacional de Notas fiscais Eletrônicas' }
    ],
    [
        { val: 'pncp', label: 'Portal Nacional de Compras Públicas - PNCP' },
        { val: 'siteEspecializado', label: 'Mídia especializada' }
    ],
    [
        { val: 'contratacaoSimilar', label: 'Contratações Similares feitas pela administração pública' },
        { val: 'direta', label: 'Pesquisa direta com fornecedor' }
    ],
];

const allFontesOptions = fontesPairs.flat().filter((f): f is {val: string, label: string} => f !== null);

const estadosBrasileiros = [
    { sigla: 'AC', nome: 'Acre' },
    { sigla: 'AL', nome: 'Alagoas' },
    { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'BA', nome: 'Bahia' },
    { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' },
    { sigla: 'ES', nome: 'Espírito Santo' },
    { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' },
    { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' },
    { sigla: 'PA', nome: 'Pará' },
    { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' },
    { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' },
];

const orcamentoCargoOptions = [
    'Vol. Civil',
    'SD QBM', 'CB QBM', '3° SGT QBM', '2° SGT QBM', '1° SGT QBM', 'ST QBM',
    '2° TEN QOBM', '2° TEN QOABM', '1° TEN QOBM', '1° TEN QOABM',
    'CAP QOBM', 'CAP QOABM', 'MAJ QOBM', 'MAJ QOABM',
    'TEN CEL QOBM', 'TEN CEL QOCBM', 'TEN CEL QOSBM',
    'CEL QOCBM', 'CEL QOSBM', 'CEL QOBM'
];

export const OrcamentoForm: React.FC<OrcamentoFormProps> = ({ data, setData }) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loteInputValue, setLoteInputValue] = useState('');
  
  // State for new supplier inputs
  const [newFornecedorNome, setNewFornecedorNome] = useState('');
  const [newFornecedorJustificativa, setNewFornecedorJustificativa] = useState('');

  const inputClasses = "w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400";

  // Effect for Price Calculation
  useEffect(() => {
    setData(prevData => {
      // Exclude 'aditivo_contratual' from auto-calculation to allow manual unit price input
      const typesRequiringMethodology = ['licitacao', 'dispensa_licitacao'];
      
      if (typesRequiringMethodology.includes(prevData.tipoOrcamento) && !prevData.metodologia) {
        return prevData;
      }

      if (prevData.tipoOrcamento === 'aditivo_contratual') {
        return prevData; // Skip auto calculation for aditivo
      }

      const newItemGroups = prevData.itemGroups.map(group => {
        const itemPrices = prevData.precosEncontrados[group.id] || [];
        const includedPrices = itemPrices.filter(p => prevData.precosIncluidos[p.id] ?? true);
        
        let newEstimate = 0;

        if (prevData.tipoOrcamento === 'adesao_ata') {
            const ataPrices = includedPrices.filter(p => p.source === 'ata');
            const otherPrices = includedPrices.filter(p => p.source !== 'ata');
            
            const valorMercado = calculateEstimate(otherPrices.map(p => p.value), prevData.metodologia || 'media');
            // Use the first Ata price found, if any.
            const precoAta = ataPrices.length > 0 ? (parseCurrency(ataPrices[0].value) ?? 0) : 0;

            if (valorMercado > 0 && precoAta > 0) {
                newEstimate = Math.min(valorMercado, precoAta);
            } else if (valorMercado > 0) {
                newEstimate = valorMercado;
            } else {
                newEstimate = precoAta;
            }
        } else { // 'licitacao', 'dispensa_licitacao'
            newEstimate = calculateEstimate(includedPrices.map(p => p.value), prevData.metodologia);
        }
        
        if (group.estimativaUnitaria !== newEstimate) {
          return { ...group, estimativaUnitaria: newEstimate };
        }
        return group;
      });
      
      if (JSON.stringify(newItemGroups) !== JSON.stringify(prevData.itemGroups)) {
          return { ...prevData, itemGroups: newItemGroups };
      }
      return prevData;
    });
  }, [data.precosEncontrados, data.precosIncluidos, data.metodologia, data.tipoOrcamento, setData]);


  // Effect for Cota Calculation
  useEffect(() => {
    setData(prevData => {
        const newItemGroups = prevData.itemGroups.map(group => {
            const totalValue = group.estimativaUnitaria * group.quantidadeTotal;
            let newCotas = [];

            if (prevData.tipoOrcamento !== 'licitacao' || totalValue > 4800000) {
                // No cotas
            } else if (prevData.modalidadeLicitacao === 'pregao_eletronico_comum') {
                const qtdCotaReservada = Math.floor(group.quantidadeTotal * 0.25);
                const qtdAmpla = group.quantidadeTotal - qtdCotaReservada;
                if (qtdCotaReservada > 0) newCotas.push({ id: 'cota_reservada', ordemTR: '1.1', tipo: 'COTA RESERVADA ME/EPP', quantidade: qtdCotaReservada });
                if (qtdAmpla > 0) newCotas.push({ id: 'cota_ampla', ordemTR: '1.2', tipo: 'AMPLA CONCORRÊNCIA', quantidade: qtdAmpla });
            } else if (prevData.modalidadeLicitacao === 'pregao_eletronico_rp') {
                const valorCotaReservada = Math.min(totalValue * 0.25, 80000);
                const qtdCotaReservada = group.estimativaUnitaria > 0 ? Math.floor(valorCotaReservada / group.estimativaUnitaria) : 0;
                const qtdAmpla = group.quantidadeTotal - qtdCotaReservada;
                if (qtdCotaReservada > 0) newCotas.push({ id: 'cota_reservada', ordemTR: '1.1', tipo: 'COTA RESERVADA ME/EPP', quantidade: qtdCotaReservada });
                if (qtdAmpla > 0) newCotas.push({ id: 'cota_ampla', ordemTR: '1.2', tipo: 'AMPLA CONCORRÊNCIA', quantidade: qtdAmpla });
            }

            if (JSON.stringify(group.cotas) !== JSON.stringify(newCotas)) {
                return { ...group, cotas: newCotas };
            }
            return group;
        });

        if (JSON.stringify(newItemGroups) !== JSON.stringify(prevData.itemGroups)) {
            return { ...prevData, itemGroups: newItemGroups };
        }
        return prevData;
    });
  }, [data.itemGroups.map(g => `${g.id}-${g.estimativaUnitaria}-${g.quantidadeTotal}`).join(), data.modalidadeLicitacao, data.tipoOrcamento, setData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setData(prev => ({
        ...prev,
        [name]: checked ? [...(prev[name as keyof OrcamentoData] as string[]), value] : (prev[name as keyof OrcamentoData] as string[]).filter(v => v !== value)
    }));
  };
  
  const handleGroupChange = (id: string, field: keyof OrcamentoItemGroup, value: string | number) => {
    setData(prev => ({
      ...prev,
      itemGroups: prev.itemGroups.map(group => group.id === id ? { ...group, [field]: value } : group)
    }));
  };

  const handleAditivoChange = (id: string, field: 'aditivoPorcentagem' | 'aditivoValor' | 'aditivoQuantidade', value: number) => {
    setData(prev => {
        return {
            ...prev,
            itemGroups: prev.itemGroups.map(group => {
                if (group.id !== id) return group;

                // Calculate based on Total Item Value (Unit * Qtd) adjusted by readjustment
                const baseUnitPrice = group.estimativaUnitaria;
                const reajusteFactor = (prev.haveraReajuste === 'sim' && prev.porcentagemReajuste) 
                    ? (1 + (prev.porcentagemReajuste / 100)) 
                    : 1;
                const adjustedUnitPrice = baseUnitPrice * reajusteFactor;
                const adjustedTotalBase = adjustedUnitPrice * group.quantidadeTotal;

                if (adjustedTotalBase <= 0 || group.quantidadeTotal <= 0 || adjustedUnitPrice <= 0) {
                     return { ...group, [field]: value };
                }

                let updates: Partial<OrcamentoItemGroup> = { [field]: value };
                
                if (field === 'aditivoPorcentagem') {
                    // Qtd = Total Qtd * %
                    updates.aditivoQuantidade = group.quantidadeTotal * (value / 100);
                    // Valor = Total Base * %
                    updates.aditivoValor = adjustedTotalBase * (value / 100);
                } else if (field === 'aditivoQuantidade') {
                    // % = (Qtd / Total Qtd) * 100
                    updates.aditivoPorcentagem = (value / group.quantidadeTotal) * 100;
                    // Valor = Qtd * Unit Price
                    updates.aditivoValor = value * adjustedUnitPrice;
                } else if (field === 'aditivoValor') {
                    // % = (Valor / Total Base) * 100
                    updates.aditivoPorcentagem = (value / adjustedTotalBase) * 100;
                    // Qtd = Valor / Unit Price
                    updates.aditivoQuantidade = value / adjustedUnitPrice;
                }
                
                return { ...group, ...updates };
            })
        };
    });
  };


  const addGroup = () => {
    const newGroup: OrcamentoItemGroup = { 
        id: Date.now().toString(), 
        itemTR: (data.itemGroups.length + 1).toString(), 
        descricao: '', 
        estimativaUnitaria: 0, 
        codigoSimas: '',
        unidade: '',
        cotas: [],
        quantidadeTotal: 0,
    };
    setData(prev => ({ ...prev, itemGroups: [...prev.itemGroups, newGroup] }));
  };

  const removeGroup = (id: string) => {
    setData(prev => {
        const newPrecosEncontrados = { ...prev.precosEncontrados };
        delete newPrecosEncontrados[id];
        const pricesToDelete = (prev.precosEncontrados[id] || []).map(p => p.id);
        const newPrecosIncluidos = { ...prev.precosIncluidos };
        pricesToDelete.forEach(pid => delete newPrecosIncluidos[pid]);

        return {
            ...prev,
            itemGroups: prev.itemGroups.filter(group => group.id !== id),
            precosEncontrados: newPrecosEncontrados,
            precosIncluidos: newPrecosIncluidos,
        };
    });
  };

  const addPrice = (itemGroupId: string, source: string) => {
    const newPrice: OrcamentoPrice = {
        id: Date.now().toString(),
        source: source,
        value: ''
    };
    setData(prev => ({
        ...prev,
        precosEncontrados: {
            ...prev.precosEncontrados,
            [itemGroupId]: [...(prev.precosEncontrados[itemGroupId] || []), newPrice]
        }
    }))
  };

  const handlePriceChange = (itemGroupId: string, priceId: string, value: string) => {
      setData(prev => ({
          ...prev,
          precosEncontrados: {
              ...prev.precosEncontrados,
              [itemGroupId]: (prev.precosEncontrados[itemGroupId] || []).map(p => p.id === priceId ? {...p, value} : p)
          }
      }))
  };
  
  const handlePriceBlur = (itemGroupId: string, priceId: string, value: string) => {
    const number = parseCurrency(value);
    if (number !== null) {
        const formattedValue = number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        setData(prev => {
            const currentPrice = prev.precosEncontrados[itemGroupId]?.find(p => p.id === priceId);
            if (currentPrice?.value === formattedValue) return prev; // Avoid re-render if value is same
            return {
                ...prev,
                precosEncontrados: {
                    ...prev.precosEncontrados,
                    [itemGroupId]: (prev.precosEncontrados[itemGroupId] || []).map(p => p.id === priceId ? {...p, value: formattedValue} : p)
                }
            };
        });
    }
  };


  const removePrice = (itemGroupId: string, priceId: string) => {
      setData(prev => ({
          ...prev,
          precosEncontrados: {
              ...prev.precosEncontrados,
              [itemGroupId]: (prev.precosEncontrados[itemGroupId] || []).filter(p => p.id !== priceId)
          }
      }))
  };

  const handleInclusionChange = (priceId: string, isIncluded: boolean) => {
      setData(prev => ({
          ...prev,
          precosIncluidos: {
              ...prev.precosIncluidos,
              [priceId]: isIncluded
          }
      }));
  };

  const availableSources = useMemo(() => {
    // Show only the sources selected in the "Fontes Consultadas" section.
    const sources = allFontesOptions.filter(option => data.fontesPesquisa.includes(option.val));

    // If the type is "Adesão à Ata", always add that as a pricing option.
    if (data.tipoOrcamento === 'adesao_ata') {
        if (!sources.some(s => s.val === 'ata')) {
            sources.push({ val: 'ata', label: 'Preço da Ata de SRP' });
        }
    }
    return sources;
  }, [data.fontesPesquisa, data.tipoOrcamento]);


  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(itemId)) {
            newSelection.delete(itemId);
        } else {
            newSelection.add(itemId);
        }
        return newSelection;
    });
  };

  const handleAgrupar = () => {
    if (selectedItems.size === 0) {
        alert("Selecione itens para agrupar.");
        return;
    }
    if (!loteInputValue.trim()) {
        alert("Digite o nome ou número do lote.");
        return;
    }
    setData(prev => ({
        ...prev,
        itemGroups: prev.itemGroups.map(item =>
            selectedItems.has(item.id) ? { ...item, loteId: loteInputValue.trim() } : item
        )
    }));
    setSelectedItems(new Set());
    setLoteInputValue('');
  };

  const handleDesagrupar = () => {
      if (selectedItems.size === 0) {
          alert("Selecione itens para desagrupar.");
          return;
      }
      setData(prev => ({
          ...prev,
          itemGroups: prev.itemGroups.map(item =>
              selectedItems.has(item.id) ? { ...item, loteId: undefined } : item
          )
      }));
      setSelectedItems(new Set());
  };
  
  const { lotes, ungrouped, sortedLoteIds } = useMemo(() => {
      const lotes: {[key: string]: OrcamentoItemGroup[]} = {};
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
      return { lotes, ungrouped, sortedLoteIds };
  }, [data.itemGroups]);
  
  const handleAddFornecedor = () => {
    if (newFornecedorNome && newFornecedorJustificativa) {
        const newFornecedor: OrcamentoFornecedor = {
            id: Date.now().toString(),
            nome: newFornecedorNome,
            justificativa: newFornecedorJustificativa,
            requisitos: ''
        };
        setData(prev => ({
            ...prev,
            fornecedoresDiretos: [...prev.fornecedoresDiretos, newFornecedor]
        }));
        setNewFornecedorNome('');
        setNewFornecedorJustificativa('');
    }
  };

  const handleRemoveFornecedor = (id: string) => {
    setData(prev => ({
        ...prev,
        fornecedoresDiretos: prev.fornecedoresDiretos.filter(f => f.id !== id)
    }));
  };

  const handleFornecedorRequisitoChange = (id: string, value: 'sim' | 'nao' | '') => {
      setData(prev => ({
          ...prev,
          fornecedoresDiretos: prev.fornecedoresDiretos.map(f => f.id === id ? { ...f, requisitos: value } : f)
      }));
  };

  const showLoteControls = data.tipoOrcamento !== 'adesao_ata' && data.tipoOrcamento !== 'aditivo_contratual';
  const isExclusiveDireta = data.fontesPesquisa.length === 1 && data.fontesPesquisa.includes('direta');
  const isAditivo = data.tipoOrcamento === 'aditivo_contratual';
  
  // Condition to show Market Research for Aditivo
  const needsAditivoResearch = isAditivo && (data.haveraReajuste === 'sim' || data.itemGroups.some(g => (g.aditivoPorcentagem || 0) > 25));
  const showPriceResearch = !isAditivo || needsAditivoResearch;

  return (
    <div className="space-y-6">
      <Section title="Dados Gerais do Orçamento">
          <Field label="Número do PAE (formato NNNN)" required>
            <input 
              type="text" 
              name="pae" 
              value={data.pae} 
              onChange={handleChange} 
              required 
              className={inputClasses} 
              placeholder="Ex: 0123"
            />
          </Field>
          <div className="grid md:grid-cols-2 gap-6">
            <Field label="Tipo de Orçamento">
                <select name="tipoOrcamento" value={data.tipoOrcamento} onChange={handleChange} className={inputClasses}>
                    <option value="licitacao">Licitação</option>
                    <option value="adesao_ata">Adesão à Ata de Registro de Preços</option>
                    <option value="dispensa_licitacao">Dispensa de Licitação</option>
                    <option value="aditivo_contratual">Aditivo Contratual</option>
                </select>
            </Field>
            {data.tipoOrcamento === 'licitacao' && (
                <Field label="Modalidade da Licitação">
                    <select name="modalidadeLicitacao" value={data.modalidadeLicitacao} onChange={handleChange} className={inputClasses}>
                        <option value="pregao_eletronico_comum">Pregão Eletrônico</option>
                        <option value="pregao_eletronico_rp">Pregão Eletrônico para SRP</option>
                        <option value="outra">Outra</option>
                    </select>
                </Field>
            )}
          </div>
           {data.tipoOrcamento === 'adesao_ata' && (
                <div className="mt-4">
                    <p className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Dados da Ata de Registro de Preços</p>
                    <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 p-4 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 shadow-sm">
                        <Field label="Número da Ata" required>
                            <input type="text" name="numeroAta" value={data.numeroAta} onChange={handleChange} required className={inputClasses} />
                        </Field>
                        <Field label="Ano da Ata" required>
                            <select name="anoAta" value={data.anoAta} onChange={handleChange} required className={inputClasses}>
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                            </select>
                        </Field>
                        <Field label="Órgão Gerenciador" required>
                            <input type="text" name="orgaoAta" value={data.orgaoAta} onChange={handleChange} required className={inputClasses} />
                        </Field>
                        <Field label="Estado" required>
                            <select name="estadoAta" value={data.estadoAta} onChange={handleChange} required className={inputClasses}>
                                <option value="">Selecione um Estado</option>
                                {estadosBrasileiros.map(estado => (
                                    <option key={estado.sigla} value={estado.sigla}>{estado.nome}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </div>
            )}
            {isAditivo && (
                <div className="mt-4">
                    <p className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Dados do Contrato</p>
                    <div className="flex flex-wrap gap-4 p-4 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 shadow-sm items-end">
                        <div className="flex-1 min-w-[200px]">
                            <Field label="Número do Contrato" required>
                                <input type="text" name="numeroContrato" value={data.numeroContrato || ''} onChange={handleChange} required className={inputClasses} />
                            </Field>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <Field label="Ano do Contrato" required>
                                <select name="anoContrato" value={data.anoContrato || ''} onChange={handleChange} required className={inputClasses}>
                                    <option value="">Selecione</option>
                                    <option value="2021">2021</option>
                                    <option value="2022">2022</option>
                                    <option value="2023">2023</option>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                </select>
                            </Field>
                        </div>
                    </div>
                </div>
            )}
      </Section>
      
      <Section title={isAditivo ? "Itens do Contrato (Valor Unitário, Quantidade e Total)" : "Itens da Contratação (Descrição e Quantidade)"}>
        {showLoteControls && selectedItems.size > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-4 mb-4 p-4 bg-gray-100 dark:bg-gray-700/80 rounded-lg">
                <span className="font-semibold dark:text-gray-200">{selectedItems.size} item(s) selecionado(s)</span>
                <input
                    type="text"
                    value={loteInputValue}
                    onChange={e => setLoteInputValue(e.target.value)}
                    placeholder="Nome/Nº do Lote"
                    className="p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
                <button onClick={handleAgrupar} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Agrupar em Lote</button>
                <button onClick={handleDesagrupar} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Desagrupar</button>
            </div>
        )}

        {showLoteControls ? (
            <>
                {sortedLoteIds.map(loteId => (
                    <div key={loteId} className="border-2 border-blue-300 dark:border-blue-600 rounded-lg p-4 mb-4">
                        <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-2">Lote {loteId}</h3>
                        {(lotes[loteId]).map(group => <ItemForm key={group.id} group={group} selected={selectedItems.has(group.id)} onSelect={toggleItemSelection} onRemove={removeGroup} onGroupChange={handleGroupChange} showSelect={true} inputClasses={inputClasses} isAditivo={isAditivo} />)}
                    </div>
                ))}
                {ungrouped.map(group => <ItemForm key={group.id} group={group} selected={selectedItems.has(group.id)} onSelect={toggleItemSelection} onRemove={removeGroup} onGroupChange={handleGroupChange} showSelect={true} inputClasses={inputClasses} isAditivo={isAditivo} />)}
            </>
        ) : (
            <>
                {data.itemGroups.map(group => <ItemForm key={group.id} group={group} selected={false} onSelect={() => {}} onRemove={removeGroup} onGroupChange={handleGroupChange} showSelect={false} inputClasses={inputClasses} isAditivo={isAditivo} />)}
            </>
        )}
        
        <button onClick={addGroup} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition mt-2">➕ Adicionar Item</button>
      </Section>
    
    {isAditivo && (
        <Section title="Dados do Reajuste">
             <div className="grid md:grid-cols-1 gap-6">
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Haverá reajuste?</label>
                    <div className="flex gap-4">
                        <label className="inline-flex items-center"><input type="radio" name="haveraReajuste" value="sim" checked={data.haveraReajuste === 'sim'} onChange={handleChange} className="mr-2"/> Sim</label>
                        <label className="inline-flex items-center"><input type="radio" name="haveraReajuste" value="nao" checked={data.haveraReajuste === 'nao'} onChange={handleChange} className="mr-2"/> Não</label>
                    </div>
                </div>
                {data.haveraReajuste === 'sim' && (
                    <div className="grid md:grid-cols-2 gap-6 p-4 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 shadow-sm">
                         <Field label="Porcentagem de Reajuste (%)" required>
                             <input type="number" name="porcentagemReajuste" value={data.porcentagemReajuste || ''} onChange={handleChange} className={inputClasses} placeholder="Ex: 5.0" />
                         </Field>
                         <Field label="Índice" required>
                             <select name="indiceReajuste" value={data.indiceReajuste || ''} onChange={handleChange} className={inputClasses}>
                                 <option value="">Selecione o Índice</option>
                                 <option value="IPCA">IPCA</option>
                                 <option value="IGP-M">IGP-M</option>
                                 <option value="INPC">INPC</option>
                                 <option value="IPC-Fipe">IPC-Fipe</option>
                                 <option value="Outro">Outro</option>
                             </select>
                         </Field>
                    </div>
                )}
             </div>
        </Section>
    )}

    {isAditivo && data.itemGroups.length > 0 && (
        <Section title="Cálculo do Valor do Aditivo" instruction="De quanto será o aditivo? Insira a porcentagem, a quantidade ou o valor (R$) do aditivo. O cálculo utiliza o valor com reajuste (se houver).">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th className="px-4 py-3">Item</th>
                            <th className="px-4 py-3">Descrição</th>
                            <th className="px-4 py-3 text-center">Qtd Original</th>
                            <th className="px-4 py-3 text-right">V. Unit. Contrato</th>
                            <th className="px-4 py-3 text-right">V. Total Base</th>
                            <th className="px-4 py-3 text-center">Aditivo (%)</th>
                            <th className="px-4 py-3 text-center">Aditivo (Qtd)</th>
                            <th className="px-4 py-3 text-center">Aditivo Total (R$)</th>
                            <th className="px-4 py-3 text-right">Novo V. Global</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.itemGroups.map(group => {
                            const baseUnitPrice = group.estimativaUnitaria;
                            // Value for the "Total Base" display (EXCLUDES reajuste)
                            const originalTotalBase = baseUnitPrice * group.quantidadeTotal;
                            
                            const aditivoTotalVal = group.aditivoValor || 0;
                            
                            // New Global Price = Original Contract Total + Aditivo Amount
                            const newGlobalPrice = originalTotalBase + aditivoTotalVal;

                            return (
                                <tr key={group.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                    <td className="px-4 py-2 font-medium">{group.itemTR}</td>
                                    <td className="px-4 py-2 truncate max-w-xs" title={group.descricao}>{group.descricao}</td>
                                    <td className="px-4 py-2 text-center">{group.quantidadeTotal}</td>
                                    <td className="px-4 py-2 text-right">{baseUnitPrice.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                                    <td className="px-4 py-2 text-right text-blue-600 dark:text-blue-400">{originalTotalBase.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            className="w-20 p-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600"
                                            value={group.aditivoPorcentagem ? parseFloat(group.aditivoPorcentagem.toFixed(2)) : ''}
                                            onChange={(e) => handleAditivoChange(group.id, 'aditivoPorcentagem', parseFloat(e.target.value) || 0)}
                                            placeholder="%"
                                        />
                                    </td>
                                     <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            className="w-20 p-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600"
                                            value={group.aditivoQuantidade ? parseFloat(group.aditivoQuantidade.toFixed(2)) : ''}
                                            onChange={(e) => handleAditivoChange(group.id, 'aditivoQuantidade', parseFloat(e.target.value) || 0)}
                                            placeholder="Qtd"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            className="w-28 p-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600"
                                            value={group.aditivoValor ? parseFloat(group.aditivoValor.toFixed(2)) : ''}
                                            onChange={(e) => handleAditivoChange(group.id, 'aditivoValor', parseFloat(e.target.value) || 0)}
                                            placeholder="R$"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-right font-bold">{newGlobalPrice.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Section>
    )}

    {showPriceResearch && (
      <Section title="Fontes Consultadas para a Pesquisa de Preço" instruction="Selecione as fontes que foram utilizadas. Apenas as fontes selecionadas aparecerão como opção ao adicionar preços.">
          <div className="space-y-4">
            {fontesPairs.map((pair, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    {pair.map((fonte, subIndex) => (
                        <div key={fonte ? fonte.val : subIndex} className="flex items-start">
                            {fonte ? (
                                <>
                                    <input
                                        type="checkbox"
                                        id={`fonte-${fonte.val}`}
                                        name="fontesPesquisa"
                                        value={fonte.val}
                                        checked={data.fontesPesquisa.includes(fonte.val)}
                                        onChange={handleCheckboxChange}
                                        className="h-4 w-4 mt-1 flex-shrink-0 rounded border-gray-300 text-cbmpa-red focus:ring-cbmpa-red"
                                    />
                                    <label htmlFor={`fonte-${fonte.val}`} className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                                        {fonte.label}
                                    </label>
                                </>
                            ) : <div />}
                        </div>
                    ))}
                </div>
            ))}
          </div>
          {isExclusiveDireta && (
            <div className="mt-6 space-y-4 bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
                <h3 className="font-bold text-gray-800 dark:text-white border-b pb-2 mb-2">Detalhamento da Pesquisa Direta</h3>
                <Field label="Justificativa da Ausência de Pesquisa de Preço no SIMAS, PNCP ou em Contratações Similares" note="Obrigatório se 'Pesquisa Direta' for a única fonte.">
                    <textarea name="justificativaAusenciaFonte" value={data.justificativaAusenciaFonte} onChange={handleChange} className={`${inputClasses} h-24`}
                    placeholder="(Caso não tenha sido realizada a pesquisa de preço em uma dessas fontes, justifique aqui)."/>
                </Field>
                <Field label="Justificativa da Pesquisa Direta com Fornecedores">
                    <textarea name="justificativaPesquisaDireta" value={data.justificativaPesquisaDireta} onChange={handleChange} className={`${inputClasses} h-24`}
                    placeholder="(Justificar o motivo de ter sido utilizada essa fonte e quais os critérios de escolha dos fornecedores consultados)."/>
                </Field>
                
                <div className="mt-6 border-t pt-4 dark:border-gray-600">
                    <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-2">Fornecedores Cotados</h4>
                    <p className="text-sm text-gray-500 mb-4">Adicione os fornecedores consultados, suas justificativas e se atenderam aos requisitos.</p>
                    
                    {data.fornecedoresDiretos.map((f, idx) => (
                         <div key={f.id} className="mb-4 p-3 bg-white dark:bg-gray-800 border rounded shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold dark:text-gray-200">{f.nome}</span>
                                <button onClick={() => handleRemoveFornecedor(f.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Remover</button>
                            </div>
                            <p className="text-sm mb-2"><span className="font-semibold">Justificativa:</span> {f.justificativa}</p>
                            <div className="flex items-center gap-4 mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                <span className="text-sm font-semibold">As propostas formais contém os requisitos?</span>
                                <label className="inline-flex items-center"><input type="radio" name={`req-${f.id}`} checked={f.requisitos === 'sim'} onChange={() => handleFornecedorRequisitoChange(f.id, 'sim')} className="mr-1"/> Sim</label>
                                <label className="inline-flex items-center"><input type="radio" name={`req-${f.id}`} checked={f.requisitos === 'nao'} onChange={() => handleFornecedorRequisitoChange(f.id, 'nao')} className="mr-1"/> Não</label>
                            </div>
                         </div>
                    ))}

                    <div className="grid md:grid-cols-[1fr_1fr_auto] gap-2 items-end mt-4">
                         <Field label="Nome do Fornecedor">
                            <input type="text" value={newFornecedorNome} onChange={e => setNewFornecedorNome(e.target.value)} className={inputClasses} placeholder="Nome da empresa"/>
                         </Field>
                         <Field label="Qual a razão da escolha?">
                            <input type="text" value={newFornecedorJustificativa} onChange={e => setNewFornecedorJustificativa(e.target.value)} className={inputClasses} placeholder="Justificativa"/>
                         </Field>
                         <div className="mb-4">
                            <button type="button" onClick={handleAddFornecedor} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg h-10">Adicionar</button>
                         </div>
                    </div>
                </div>
            </div>
          )}
      </Section>
      )}
      
      {showPriceResearch && (
      <Section title="Metodologia da Estimativa de Preço" instruction="Selecione uma metodologia para calcular o preço estimado (Média de Mercado).">
          <RadioGroup name="metodologia" value={data.metodologia} options={[
              {val: 'menor', label: 'Menor preço'},
              {val: 'media', label: 'Média aritmética'},
              {val: 'mediana', label: 'Mediana'}
          ]} onChange={handleChange} />
      </Section>
      )}
      
      {showPriceResearch && (
      <Section title="Resultado da Pesquisa (Preços Encontrados)" instruction="Adicione os preços pesquisados para comparação.">
        {data.itemGroups.map(group => (
            <div key={group.id} className="p-4 border rounded-lg mb-4 bg-white dark:bg-gray-800 shadow">
                <h3 className="font-bold text-lg mb-2 dark:text-gray-200">Item {group.itemTR}: {group.descricao.substring(0, 50)}...</h3>
                <div className="space-y-2">
                    {(data.precosEncontrados[group.id] || []).map(price => (
                        <div key={price.id} className="grid grid-cols-[auto_1fr_1.2fr_auto] gap-2 items-center">
                            <input type="checkbox" title="Incluir no cálculo" checked={data.precosIncluidos[price.id] ?? true} onChange={e => handleInclusionChange(price.id, e.target.checked)} className="h-4 w-4"/>
                            <span className="font-semibold text-sm dark:text-gray-300">{availableSources.find(s => s.val === price.source)?.label || price.source}</span>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500 dark:text-gray-400">R$</span>
                                <input 
                                    type="text" 
                                    placeholder="0,00" 
                                    value={price.value} 
                                    onChange={e => handlePriceChange(group.id, price.id, e.target.value)} 
                                    onBlur={e => handlePriceBlur(group.id, price.id, e.target.value)}
                                    className="w-full p-1 pl-8 border-gray-300 border rounded-md text-right dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" 
                                />
                            </div>
                            <button onClick={() => removePrice(group.id, price.id)} className="text-red-500 hover:text-red-700 font-bold px-2">X</button>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <select className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" onChange={e => {if(e.target.value) addPrice(group.id, e.target.value); e.target.value = ""}}>
                        <option value="">-- Adicionar Fonte --</option>
                        {availableSources.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
                    </select>
                </div>
            </div>
        ))}
        {data.itemGroups.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400">Adicione um item para inserir preços.</p>}

        <div className="mt-6">
            <Field label="Houve descarte de preço?"><RadioGroup name="houveDescarte" value={data.houveDescarte} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}]} onChange={handleChange} /></Field>
            {data.houveDescarte === 'sim' && <Field label="Justificativa do Descarte"><textarea name="justificativaDescarte" value={data.justificativaDescarte} onChange={handleChange} className={`${inputClasses} h-24`}/></Field>}
        </div>
      </Section>
      )}

      {needsAditivoResearch && (
          <Section title="Comparativo: Novo Valor do Contrato x Média de Mercado">
               <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th className="px-4 py-3">Item</th>
                            <th className="px-4 py-3">Descrição</th>
                            <th className="px-4 py-3 text-right">Novo V. Unitário (Contrato + Aditivo)</th>
                            <th className="px-4 py-3 text-right">V. Médio Mercado</th>
                            <th className="px-4 py-3 text-right">Diferença</th>
                        </tr>
                    </thead>
                    <tbody>
                    {data.itemGroups.map(group => {
                        // Calculate New Unit Price (Contract + Aditivo)
                        const baseUnitPrice = group.estimativaUnitaria;
                        const reajusteFactor = (data.haveraReajuste === 'sim' && data.porcentagemReajuste) ? (1 + (data.porcentagemReajuste / 100)) : 1;
                        const adjustedTotalBase = (baseUnitPrice * reajusteFactor) * group.quantidadeTotal;
                        const aditivoTotalVal = group.aditivoValor || 0;
                        const newGlobalPrice = adjustedTotalBase + aditivoTotalVal;
                        const newUnitPrice = group.quantidadeTotal > 0 ? newGlobalPrice / group.quantidadeTotal : 0;

                        // Calculate Market Average from Research
                        const itemPrices = data.precosEncontrados[group.id] || [];
                        const includedPrices = itemPrices.filter(p => data.precosIncluidos[p.id] ?? true);
                        const marketAverage = calculateEstimate(includedPrices.map(p => p.value), 'media'); // Force average for comparison as per prompt

                        const difference = newUnitPrice - marketAverage;
                        const diffColor = difference <= 0 ? 'text-green-600' : 'text-red-600';

                        return (
                            <tr key={group.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <td className="px-4 py-2 font-medium">{group.itemTR}</td>
                                <td className="px-4 py-2 truncate max-w-xs" title={group.descricao}>{group.descricao}</td>
                                <td className="px-4 py-2 text-right font-bold">{newUnitPrice.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                                <td className="px-4 py-2 text-right">{marketAverage.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                                <td className={`px-4 py-2 text-right font-bold ${diffColor}`}>{difference.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
               </div>
          </Section>
      )}
      
      <Section title="Assinatura">
        <div className="grid md:grid-cols-2 gap-6">
            <Field label="Cidade" required>
                <input type="text" name="cidade" value={data.cidade} onChange={handleChange} required className={inputClasses} />
            </Field>
            <Field label="Data" required>
                <input type="date" name="data" value={data.data} onChange={handleChange} required className={inputClasses} />
            </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
             <div className="p-4 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 shadow-sm">
                <p className="font-bold mb-2 text-cbmpa-red dark:text-red-400 border-b pb-1">Assinante 1 (Responsável)</p>
                <Field label="Nome Completo" required>
                    <input type="text" name="assinante1Nome" value={data.assinante1Nome} onChange={handleChange} required className={inputClasses} />
                </Field>
                <Field label="Nome de Guerra" required>
                    <input type="text" name="assinante1NomeGuerra" value={data.assinante1NomeGuerra} onChange={handleChange} required className={inputClasses} />
                </Field>
                <Field label="Cargo" required>
                    <select name="assinante1Cargo" value={data.assinante1Cargo} onChange={handleChange} required className={inputClasses}>
                        <option value="">Selecione o Cargo</option>
                        {orcamentoCargoOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </Field>
                <Field label="Função" required>
                    <input type="text" name="assinante1Funcao" value={data.assinante1Funcao} onChange={handleChange} required className={inputClasses} />
                </Field>
            </div>

            <div className="p-4 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 shadow-sm">
                <p className="font-bold mb-2 text-cbmpa-red dark:text-red-400 border-b pb-1">Assinante 2</p>
                <Field label="Nome Completo" required>
                    <input type="text" name="assinante2Nome" value={data.assinante2Nome} onChange={handleChange} required className={inputClasses} />
                </Field>
                <Field label="Nome de Guerra" required>
                    <input type="text" name="assinante2NomeGuerra" value={data.assinante2NomeGuerra} onChange={handleChange} required className={inputClasses} />
                </Field>
                <Field label="Cargo" required>
                    <select name="assinante2Cargo" value={data.assinante2Cargo} onChange={handleChange} required className={inputClasses}>
                        <option value="">Selecione o Cargo</option>
                        {orcamentoCargoOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </Field>
                <Field label="Função" required>
                    <input type="text" name="assinante2Funcao" value={data.assinante2Funcao} onChange={handleChange} required className={inputClasses} />
                </Field>
            </div>
        </div>
      </Section>
    </div>
  );
};


// Helper component for Item form to avoid re-rendering the whole list on every change
interface ItemFormProps {
    group: OrcamentoItemGroup;
    selected: boolean;
    onSelect: (id: string) => void;
    onRemove: (id: string) => void;
    onGroupChange: (id: string, field: keyof OrcamentoItemGroup, value: string | number) => void;
    showSelect: boolean;
    inputClasses: string;
    isAditivo: boolean;
}
const ItemForm: React.FC<ItemFormProps> = ({ group, selected, onSelect, onRemove, onGroupChange, showSelect, inputClasses, isAditivo }) => (
    <div className="p-4 border-2 border-cbmpa-red rounded-lg mb-4 bg-white dark:bg-gray-800 shadow-md relative">
        <div className="absolute top-2 right-2 flex items-center gap-4">
            {showSelect && <input type="checkbox" checked={selected} onChange={() => onSelect(group.id)} className="h-5 w-5" title="Selecionar para agrupar"/>}
            <button onClick={() => onRemove(group.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded">Remover</button>
        </div>
        <div className="grid md:grid-cols-[1fr_2fr] gap-x-6 items-start">
            <div>
                <Field label="Item TR" required><input type="text" value={group.itemTR} onChange={e => onGroupChange(group.id, 'itemTR', e.target.value)} className={inputClasses}/></Field>
                <Field label="Código SIMAS"><input type="text" value={group.codigoSimas} onChange={e => onGroupChange(group.id, 'codigoSimas', e.target.value)} className={inputClasses}/></Field>
                <Field label="Unidade" required><input type="text" value={group.unidade} onChange={e => onGroupChange(group.id, 'unidade', e.target.value)} className={inputClasses}/></Field>
                <Field label="Quantidade Total" required><input type="number" value={group.quantidadeTotal} onChange={e => onGroupChange(group.id, 'quantidadeTotal', parseFloat(e.target.value) || 0)} className={inputClasses}/></Field>
                {isAditivo && (
                     <Field label="Valor Unitário Contrato" required>
                        <input 
                            type="number" 
                            value={group.estimativaUnitaria} 
                            onChange={e => onGroupChange(group.id, 'estimativaUnitaria', parseFloat(e.target.value) || 0)} 
                            className={inputClasses}
                        />
                     </Field>
                )}
            </div>
            <div>
                <Field label="Descrição" required>
                    <div className="relative">
                        <textarea value={group.descricao} onChange={e => onGroupChange(group.id, 'descricao', e.target.value)} required className={`${inputClasses} h-40 pr-10`}/>
                        <AiAssistant fieldName={`Descrição do Item ${group.itemTR}`} onGeneratedText={(text) => onGroupChange(group.id, 'descricao', text)} />
                    </div>
                </Field>
                {!isAditivo && (
                    <div className="mt-2 p-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                        <p className="font-semibold text-sm dark:text-gray-300">Estimativa Unitária (Calculada): <span className="font-bold text-cbmpa-red">{group.estimativaUnitaria.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></p>
                    </div>
                )}
            </div>
        </div>
    </div>
);
