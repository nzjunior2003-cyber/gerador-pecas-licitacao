

import React from 'react';
import { EtpData, EtpItem, EtpQualidadeItem } from '../types';

interface EtpFormProps {
  data: EtpData;
  setData: React.Dispatch<React.SetStateAction<EtpData>>;
}

const cargoOptions = [
    'SD QBM', 'CB QBM', '3° SGT QBM', '2° SGT QBM', '1° SGT QBM', 'ST QBM',
    '2° TEN QOBM', '2° TEN QOABM', '1° TEN QOBM', '1° TEN QOABM',
    'CAP QOBM', 'CAP QOABM', 'MAJ QOBM', 'MAJ QOABM',
    'TCEL QOBM', 'CEL QOBM', 'CEL QOCBM', 'CEL QOSBM'
];

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 dark:bg-gray-700/50 dark:border-gray-600">
        <h2 className="text-xl font-bold text-cbmpa-red mb-4 pb-2 border-b-2 border-cbmpa-red">{title}</h2>
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

const RadioGroup: React.FC<{ name: keyof EtpData, value: string, options: {val: string, label: string}[], onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ name, value, options, onChange }) => (
    <div className="flex flex-col gap-y-2">
        {options.map(opt => (
            <div key={opt.val} className="flex items-start">
                <input type="radio" id={`${name}-${opt.val}`} name={name} value={opt.val} checked={value === opt.val} onChange={onChange} className="mr-2 h-4 w-4 mt-1 flex-shrink-0"/>
                <label htmlFor={`${name}-${opt.val}`} className="dark:text-gray-300">{opt.label}</label>
            </div>
        ))}
    </div>
);

const Checkbox: React.FC<{ name: string, value: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, children: React.ReactNode }> = ({ name, value, checked, onChange, children }) => (
    <div className="flex items-start">
        <input type="checkbox" id={`${name}-${value.replace(/\s/g, '')}`} name={name} value={value} checked={checked} onChange={onChange} className="mr-2 h-4 w-4 mt-1 flex-shrink-0"/>
        <label htmlFor={`${name}-${value.replace(/\s/g, '')}`} className="dark:text-gray-300">{children}</label>
    </div>
);

export const EtpForm: React.FC<EtpFormProps> = ({ data, setData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setData(prev => {
        const field = name as keyof EtpData;
        const prevValue = prev[field] as string[];
        return {
            ...prev,
            [field]: checked ? [...prevValue, value] : prevValue.filter(v => v !== value)
        }
    });
  };

  const handleItemChange = (id: string, field: keyof EtpItem, value: string | number) => {
      setData(prev => ({
          ...prev,
          itens: prev.itens.map(item => item.id === id ? { ...item, [field]: value } : item)
      }));
  };

  const addItem = () => {
      const newItem: EtpItem = { id: Date.now().toString(), descricao: '', unidade: '', quantidade: 0, valorUnitario: 0 };
      setData(prev => ({ ...prev, itens: [...prev.itens, newItem] }));
  };
  
  const removeItem = (id: string) => {
      setData(prev => ({ ...prev, itens: prev.itens.filter(item => item.id !== id) }));
  };

  const addQualidadeItem = () => {
    const newItem: EtpQualidadeItem = { id: Date.now().toString(), descricao: '' };
    setData(prev => ({ ...prev, padraoQualidade: [...prev.padraoQualidade, newItem] }));
  };

  const removeQualidadeItem = (id: string) => {
    setData(prev => ({ ...prev, padraoQualidade: prev.padraoQualidade.filter(item => item.id !== id) }));
  };

  const handleQualidadeChange = (id: string, value: string) => {
    setData(prev => ({
        ...prev,
        padraoQualidade: prev.padraoQualidade.map(item => item.id === id ? { ...item, descricao: value } : item)
    }));
  };

  const totalGeral = data.itens.reduce((sum, item) => sum + (item.quantidade * item.valorUnitario), 0);

  const inputClasses = "w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400";

  return (
    <div className="space-y-6">
      <Section title="Identificação do Documento">
        <div className="grid md:grid-cols-3 gap-6">
          <Field label="Número do ETP" required><input type="text" name="numero" value={data.numero} onChange={handleChange} required className={inputClasses} /></Field>
          <Field label="Ano" required><input type="text" name="ano" value={data.ano} onChange={handleChange} required className={inputClasses} /></Field>
          <Field label="PAE nº" required><input type="text" name="pae" value={data.pae} onChange={handleChange} required className={inputClasses} /></Field>
        </div>
      </Section>
      
      <Section title="1 – DESCRIÇÃO DA NECESSIDADE">
        <Field label="1.1. Qual a necessidade a ser atendida?" required>
          <textarea name="necessidade" value={data.necessidade} onChange={handleChange} required className={`${inputClasses} h-24`} />
        </Field>
      </Section>

      <Section title="2 – LEVANTAMENTO DE MERCADO">
        <Field label="2.1. Onde foram pesquisadas as possíveis soluções?" required>
            {['Consulta a fornecedores', 'Internet', 'Contratações similares', 'Audiência pública', 'Outro'].map(val => (
                <div key={val} className="flex items-center"><input type="checkbox" name="fontesPesquisa" value={val} checked={data.fontesPesquisa.includes(val)} onChange={handleCheckboxChange} className="mr-2"/><label className="dark:text-gray-300">{val}</label></div>
            ))}
            {data.fontesPesquisa.includes('Outro') && <input type="text" name="fonteOutro" value={data.fonteOutro} onChange={handleChange} placeholder="Especifique" className={`${inputClasses} mt-2`}/>}
        </Field>
        <Field label="2.2. Justificativa técnica e econômica para a escolha da melhor solução" required><textarea name="justificativaTecnica" value={data.justificativaTecnica} onChange={handleChange} required className={`${inputClasses} h-24`} /></Field>
        <Field label="2.3. Há restrição de fornecedores?" required><RadioGroup name="restricaoFornecedores" value={data.restricaoFornecedores} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}]} onChange={handleChange} /></Field>
      </Section>

      <Section title="3 – DESCRIÇÃO DOS REQUISITOS DE CONTRATAÇÃO">
        <Field label="3.1 - Qual o tipo de objeto?" required>
            <div className="flex flex-col gap-y-2">
                {[
                    {val: 'bem', label: 'Bem.'}, {val: 'servico', label: 'Serviço.'},
                    {val: 'locacao', label: 'Locação de imóvel.'}, {val: 'obra', label: 'Obra ou serviço de engenharia.'}
                ].map(opt => (
                    <Checkbox key={opt.val} name="tipoObjeto" value={opt.val} checked={data.tipoObjeto.includes(opt.val)} onChange={handleCheckboxChange}>{opt.label}</Checkbox>
                ))}
            </div>
        </Field>
        <Field label="3.2 - Qual a natureza?" required><RadioGroup name="natureza" value={data.natureza} options={[{val: 'continuada', label: 'Continuada'}, {val: 'nao-continuada', label: 'Não-continuada'}]} onChange={handleChange} /></Field>
        <Field label="3.3. Há monopólio?" required><RadioGroup name="monopolio" value={data.monopolio} options={[{val: 'sim', label: 'Sim, apenas um único fornecedor é capaz de atender a demanda.'}, {val: 'nao', label: 'Não, há mais de um fornecedor capaz de atender a demanda.'}]} onChange={handleChange} /></Field>
        <Field label="3.4. Qual a vigência do contrato?" required>
            <RadioGroup name="vigencia" value={data.vigencia} options={[{val: '30 dias (pronta entrega).', label: '30 dias (pronta entrega).'}, {val: '180 dias.', label: '180 dias.'}, {val: '12 meses.', label: '12 meses.'}, {val: 'Indeterminado.', label: 'Indeterminado.'}, {val: 'outro', label: 'Outro:'}]} onChange={handleChange} />
            {data.vigencia === 'outro' && <div className="flex items-center gap-2 mt-2 p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"><input type="number" name="vigenciaOutroNum" value={data.vigenciaOutroNum} onChange={handleChange} className={`${inputClasses} w-1/3`} placeholder="Nº"/><select name="vigenciaOutroTipo" value={data.vigenciaOutroTipo} onChange={handleChange} className={`${inputClasses} w-2/3`}><option value="dias">dias</option><option value="meses">meses</option><option value="anos">anos</option></select></div>}
        </Field>
        <Field label="3.5. Poderá haver prorrogação?" required><RadioGroup name="prorrogacao" value={data.prorrogacao} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}, {val: 'na', label: 'Não se aplica'}]} onChange={handleChange} /></Field>
        <Field label="3.6. Transição Contratual" required><RadioGroup name="transicao" value={data.transicao} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}]} onChange={handleChange} /></Field>
        {data.transicao === 'sim' && <div className='grid md:grid-cols-2 gap-4 mt-2'><input name="transicaoContrato" value={data.transicaoContrato} onChange={handleChange} placeholder="Nº do Contrato" className={inputClasses}/><input name="transicaoPrazo" value={data.transicaoPrazo} onChange={handleChange} placeholder="Prazo" className={inputClasses}/></div>}
        <div className="mt-4">
            <h3 className="text-gray-700 dark:text-gray-300 font-semibold mb-2">3.7. Padrão Mínimo de Qualidade</h3>
            {data.padraoQualidade.map((item, index) => (<div key={item.id} className="p-4 border rounded-md mb-2 bg-white dark:bg-gray-800 dark:border-gray-600"><div className="flex justify-between items-center mb-2"><h4 className="font-semibold dark:text-gray-200">Item de Qualidade {index + 1}</h4><button onClick={() => removeQualidadeItem(item.id)} className="text-red-500 hover:text-red-700 font-bold">Remover</button></div><textarea value={item.descricao} onChange={(e) => handleQualidadeChange(item.id, e.target.value)} className={`${inputClasses} h-20`} placeholder="Descrição detalhada"/></div>))}
            <button onClick={addQualidadeItem} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition mt-2">➕ Adicionar Item de Qualidade</button>
        </div>
        <Field label="3.8. Quais critérios de sustentabilidade?">
            <div className="flex flex-col gap-y-2">
                {['Utilização de bens constituídos, no todo ou em parte, por material reciclado, atóxico e biodegradável, conforme as normas técnicas aplicáveis.', 'Não utilização de bens e produtos com substâncias perigosas em concentração acima da recomendada na diretiva RoHS (RestrictionofCertainHazardousSubstances) e outras diretivas similares, tais como mercúrio (Hg), chumbo (Pb), cromo hexavalente [Cr(VI)], cádmio (Cd), bifenil-polibromados (PBB’s) e éteres difenil-polibromados (PBDE’s).', 'Atendimento aos requisitos ambientais para a obtenção de certificação pelos órgãos competentes como produtos sustentáveis e/ou de menor impacto ambiental em relação aos seus similares.', 'Maior ciclo de vida e menor custo de manutenção do bem.', 'Utilização, preferencial, de embalagem adequada, com o menor volume possível, que utilize materiais recicláveis, de forma a garantir a máxima proteção durante o transporte e o armazenamento.', 'Não foram adotados critérios de sustentabilidade, conforme fundamentação técnica e mercadológica em anexo.', 'Outro.'].map(opt => (
                    <Checkbox key={opt} name="sustentabilidade" value={opt} checked={data.sustentabilidade.includes(opt)} onChange={handleCheckboxChange}>{opt}</Checkbox>
                ))}
                {data.sustentabilidade.includes('Outro.') && <input type="text" name="sustentabilidadeOutro" value={data.sustentabilidadeOutro} onChange={handleChange} placeholder="Especificar" className={`${inputClasses} mt-2 ml-6`}/>}
            </div>
        </Field>
        <Field label="3.9. Há prioridade para aquisição ou contratação, conforme Lei nº 12.035/2010?"><RadioGroup name="prioridadeLeiTipo" value={data.prioridadeLeiTipo} options={[{val: 'reciclados', label: 'Sim, para produtos reciclados e recicláveis.'}, {val: 'sustentaveis', label: 'Sim, para bens, serviços e obras que considerem critérios compatíveis com padrões de consumo social e ambientalmente sustentáveis.'}, {val: 'nao', label: 'Não.'}]} onChange={handleChange} /></Field>
        {data.prioridadeLeiTipo === 'nao' && <Field label="Justificativa"><textarea name="prioridadeLeiJustificativa" value={data.prioridadeLeiJustificativa} onChange={handleChange} className={`${inputClasses} h-20`}/></Field>}
        <Field label="3.10. Há necessidade de treinamento?"><RadioGroup name="treinamento" value={data.treinamento} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}]} onChange={handleChange} /></Field>
      </Section>

      <Section title="4 – DESCRIÇÃO DA SOLUÇÃO">
         <Field label="4.1. O que será contratado?"><textarea name="solucaoContratacao" value={data.solucaoContratacao} onChange={handleChange} className={`${inputClasses} h-24`}/></Field>
         <Field label="4.2. Qual o prazo da garantia contratual?">
            <RadioGroup name="garantiaContratual" value={data.garantiaContratual} options={[{val: 'nao_ha', label: 'Não há.'}, {val: '90_dias', label: '90 dias.'}, {val: '12_meses', label: '12 meses.'}, {val: 'outro', label: 'Outro:'}]} onChange={handleChange} />
            {data.garantiaContratual === 'outro' && <div className="flex items-center gap-2 mt-2 p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"><input type="number" name="garantiaOutroNum" value={data.garantiaOutroNum} onChange={handleChange} className={`${inputClasses} w-1/3`} placeholder="Nº"/><select name="garantiaOutroTipo" value={data.garantiaOutroTipo} onChange={handleChange} className={`${inputClasses} w-2/3`}><option value="dias">dias</option><option value="meses">meses</option><option value="anos">anos</option></select></div>}
         </Field>
         <Field label="4.3. Há necessidade de assistência técnica?"><RadioGroup name="assistenciaTecnica" value={data.assistenciaTecnica} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}]} onChange={handleChange} /></Field>
         <Field label="4.4. Há necessidade de manutenção?"><RadioGroup name="manutencao" value={data.manutencao} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}]} onChange={handleChange} /></Field>
       </Section>

      <Section title="5 – DIMENSIONAMENTO DO OBJETO">
        <Field label="5.1. Como se obteve o quantitativo estimado?">
            <div className="flex flex-col gap-y-2">
                {['Análise de contratações anteriores.', 'Levantamento atual.', 'Análise de contratações similares.', 'Outro.'].map(opt => (
                    <Checkbox key={opt} name="metodoQuantitativo" value={opt} checked={data.metodoQuantitativo.includes(opt)} onChange={handleCheckboxChange}>{opt}</Checkbox>
                ))}
                {data.metodoQuantitativo.includes('Outro.') && <input type="text" name="metodoOutro" value={data.metodoOutro} onChange={handleChange} placeholder="Especificar" className={`${inputClasses} mt-2 ml-6`}/>}
            </div>
        </Field>
        <Field label="5.2. Descrição do Quantitativo" required><textarea name="descricaoQuantitativo" value={data.descricaoQuantitativo} onChange={handleChange} required className={`${inputClasses} h-24`}/></Field>
        <div className="mt-4"><h3 className="text-gray-700 dark:text-gray-300 font-semibold mb-2">5.3. Especificação</h3>{data.itens.map((item, index) => (<div key={item.id} className="p-4 border rounded-md mb-2 bg-white dark:bg-gray-800 dark:border-gray-600"><div className="flex justify-between items-center mb-2"><h4 className="font-semibold dark:text-gray-200">Item {index + 1}</h4><button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 font-bold">Remover</button></div><Field label="Descrição" required><textarea value={item.descricao} onChange={e => handleItemChange(item.id, 'descricao', e.target.value)} required className={`${inputClasses} h-20`}/></Field><div className="grid md:grid-cols-3 gap-4"><Field label="Unidade" required><input type="text" value={item.unidade} onChange={e => handleItemChange(item.id, 'unidade', e.target.value)} required className={inputClasses}/></Field><Field label="Quantidade" required><input type="number" value={item.quantidade} onChange={e => handleItemChange(item.id, 'quantidade', parseFloat(e.target.value) || 0)} required className={inputClasses}/></Field><Field label="Valor Unitário (R$)" required><input type="number" value={item.valorUnitario} onChange={e => handleItemChange(item.id, 'valorUnitario', parseFloat(e.target.value) || 0)} required className={inputClasses}/></Field></div></div>))}<button onClick={addItem} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition mt-2">➕ Adicionar Item</button></div>
      </Section>
      
      <Section title="6 – ESTIMATIVA DO VALOR DA CONTRATAÇÃO">
        <Field label="6.1 - Meios usados na pesquisa">
             <div className="flex flex-col gap-y-2">
                {['Painel de preços.', 'Contratações similares.', 'Simas.', 'Fornecedores.', 'Internet.', 'Outro.'].map(opt => (
                    <Checkbox key={opt} name="meiosPesquisa" value={opt} checked={data.meiosPesquisa.includes(opt)} onChange={handleCheckboxChange}>{opt}</Checkbox>
                ))}
                {data.meiosPesquisa.includes('Outro.') && <input type="text" name="meiosPesquisaOutro" value={data.meiosPesquisaOutro} onChange={handleChange} placeholder="Especificar" className={`${inputClasses} mt-2 ml-6`}/>}
            </div>
        </Field>
        <Field label="6.2. Estimativa de Preço"><div className="overflow-x-auto border rounded-lg dark:border-gray-600"><table className="w-full text-sm text-left text-gray-600 dark:text-gray-400"><thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300"><tr><th scope="col" className="px-4 py-3">Item</th><th scope="col" className="px-4 py-3">Descrição</th><th scope="col" className="px-4 py-3 text-right">Valor Unit.</th><th scope="col" className="px-4 py-3 text-center">Qtd</th><th scope="col" className="px-4 py-3 text-right">Valor Total</th></tr></thead><tbody>{data.itens.length > 0 ? data.itens.map((item, index) => (<tr key={item.id} className="bg-white border-b hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"><th scope="row" className="px-4 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">{index + 1}</th><td className="px-4 py-2">{item.descricao}</td><td className="px-4 py-2 text-right">{item.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td className="px-4 py-2 text-center">{item.quantidade}</td><td className="px-4 py-2 text-right">{(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>)) : (<tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"><td colSpan={5} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">Nenhum item adicionado.</td></tr>)}</tbody><tfoot><tr className="font-bold text-gray-900 bg-gray-100 dark:bg-gray-700 dark:text-white"><th scope="row" colSpan={4} className="px-4 py-3 text-base text-right">VALOR TOTAL ESTIMADO</th><td className="px-4 py-3 text-base text-right">{totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr></tfoot></table></div></Field>
      </Section>

      <Section title="7 – JUSTIFICATIVA PARA O PARCELAMENTO DA SOLUÇÃO">
          <Field label="7.1 - A solução será dividida em itens?"><RadioGroup name="parcelamento" value={data.parcelamento} options={[{val: 'sim', label: 'Sim.'}, {val: 'nao', label: 'Não.'}]} onChange={handleChange} /></Field>
          {data.parcelamento === 'nao' && <Field label="Por quê?"><div className="flex flex-col gap-y-2">
            {['Objeto indivisível.', 'Perda de escala.', 'Tecnicamente inviável.', 'Economicamente inviável.', 'Aproveitamento da competitividade.', 'Outro.'].map(opt => (
                <Checkbox key={opt} name="motivosNaoParcelamento" value={opt} checked={data.motivosNaoParcelamento.includes(opt)} onChange={handleCheckboxChange}>{opt}</Checkbox>
            ))}
            {data.motivosNaoParcelamento.includes('Outro.') && <input type="text" name="motivosNaoParcelamentoOutro" value={data.motivosNaoParcelamentoOutro} onChange={handleChange} placeholder="Especificar" className={`${inputClasses} mt-2 ml-6`}/>}
          </div></Field>}
      </Section>
      
      <Section title="8 – CONTRATAÇÕES CORRELATAS OU INTERDEPENDENTES">
          <Field label="8.1 - Há contratações correlatas ou interdependentes?"><RadioGroup name="contratacoesCorrelatas" value={data.contratacoesCorrelatas} options={[{val: 'sim', label: 'Sim.'}, {val: 'nao', label: 'Não.'}]} onChange={handleChange} /></Field>
          {data.contratacoesCorrelatas === 'sim' && <Field label="Especificar"><textarea name="contratacoesCorrelatasEspecificar" value={data.contratacoesCorrelatasEspecificar} onChange={handleChange} className={`${inputClasses} h-20`}/></Field>}
      </Section>
      
      <Section title="9 – ALINHAMENTO DA CONTRATAÇÃO COM O PLANEJAMENTO">
          <Field label="9.1 - Há previsão no plano de contratações anual?"><RadioGroup name="previsaoPCA" value={data.previsaoPCA} options={[{val: 'sim', label: 'Sim.'}, {val: 'nao', label: 'Não.'}]} onChange={handleChange} /></Field>
          {data.previsaoPCA === 'sim' && <Field label="Especificar item do PCA:"><input type="text" name="itemPCA" value={data.itemPCA} onChange={handleChange} className={inputClasses}/></Field>}
          {data.previsaoPCA === 'nao' && <Field label="Justificativa e providências:"><textarea name="justificativaPCA" value={data.justificativaPCA} onChange={handleChange} className={`${inputClasses} h-20`}/></Field>}
      </Section>
      
      <Section title="10 – RESULTADOS PRETENDIDOS">
          <Field label="10.1 - Quais os benefícios pretendidos na contratação?">
            <div className="flex flex-col gap-y-2">
                {['Manutenção do Funcionamento Administrativo', 'Redução de Custos', 'Aproveitamento de Recursos Humanos', 'Redução dos Riscos do Trabalho', 'Ganho de Eficiência', 'Serviço/Bem de Consumo', 'Realização de Política Pública', 'Outro.'].map(opt => (
                    <Checkbox key={opt} name="beneficios" value={opt} checked={data.beneficios.includes(opt)} onChange={handleCheckboxChange}>{opt}</Checkbox>
                ))}
                {data.beneficios.includes('Outro.') && <input type="text" name="beneficiosOutro" value={data.beneficiosOutro} onChange={handleChange} placeholder="Especificar" className={`${inputClasses} mt-2 ml-6`}/>}
            </div>
          </Field>
      </Section>
      
      <Section title="11 – PENDÊNCIAS RELATIVAS À CONTRATAÇÃO">
          <Field label="11.1 - Há providências pendentes para o sucesso da contratação?"><RadioGroup name="pendencias" value={data.pendencias} options={[{val: 'sim', label: 'Sim.'}, {val: 'nao', label: 'Não.'}]} onChange={handleChange} /></Field>
          {data.pendencias === 'sim' && <Field label="Especificar:"><textarea name="pendenciasEspecificar" value={data.pendenciasEspecificar} onChange={handleChange} className={`${inputClasses} h-20`}/></Field>}
          <Field label="11.2 - Quais são os setores responsáveis pelas providências pendentes?"><textarea name="pendenciasResponsaveis" value={data.pendenciasResponsaveis} onChange={handleChange} className={`${inputClasses} h-20`}/></Field>
      </Section>

      <Section title="12 – IMPACTOS AMBIENTAIS E MEDIDAS DE MITIGAÇÃO">
          <Field label="12.1 - Há previsão de impacto ambiental na contratação?"><RadioGroup name="impactoAmbiental" value={data.impactoAmbiental} options={[{val: 'sim', label: 'Sim.'}, {val: 'nao', label: 'Não.'}]} onChange={handleChange} /></Field>
          {data.impactoAmbiental === 'sim' && <div className='space-y-4'>
            <Field label="Impactos:"><textarea name="impactos" value={data.impactos} onChange={handleChange} className={`${inputClasses} h-20`}/></Field>
            <Field label="Medidas de mitigação:"><textarea name="medidasMitigacao" value={data.medidasMitigacao} onChange={handleChange} className={`${inputClasses} h-20`}/></Field>
          </div>}
      </Section>
      
      <Section title="13 – DECLARAÇÃO DE VIABILIDADE">
          <Field label="13.1 - A contratação possui viabilidade técnica, socioeconômica e ambiental?"><RadioGroup name="viabilidade" value={data.viabilidade} options={[{val: 'sim', label: 'Sim.'}, {val: 'nao', label: 'Não.'}]} onChange={handleChange} /></Field>
      </Section>

      <Section title="Assinatura">
        <div className="grid md:grid-cols-2 gap-6">
          <Field label="Cidade" required><input type="text" name="cidade" value={data.cidade} onChange={handleChange} required className={inputClasses} /></Field>
          <Field label="Data" required><input type="date" name="data" value={data.data} onChange={handleChange} required className={inputClasses} /></Field>
          <Field label="Nome do Servidor" required><input type="text" name="nome" value={data.nome} onChange={handleChange} required className={inputClasses} /></Field>
          <Field label="Cargo" required>
            <select name="cargo" value={data.cargo} onChange={handleChange} required className={inputClasses}>
                <option value="">Selecione o cargo</option>
                {cargoOptions.map(cargo => <option key={cargo} value={cargo}>{cargo}</option>)}
            </select>
          </Field>
          <Field label="Função" required><input type="text" name="funcao" value={data.funcao} onChange={handleChange} required className={inputClasses} /></Field>
        </div>
      </Section>
    </div>
  );
};