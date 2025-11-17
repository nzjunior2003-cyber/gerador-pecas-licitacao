import React, { useCallback } from 'react';
import { EtpData, EtpItem, EtpQualidadeItem } from '../types';

interface EtpFormProps {
  data: EtpData;
  setData: React.Dispatch<React.SetStateAction<EtpData>>;
}

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

export const EtpForm: React.FC<EtpFormProps> = ({ data, setData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setData(prev => ({
        ...prev,
        [name]: checked ? [...(prev[name as keyof EtpData] as string[]), value] : (prev[name as keyof EtpData] as string[]).filter(v => v !== value)
    }));
  };

  const handlePrioridadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setData(prev => {
        const currentPrioridades = prev.prioridadeLei;
        let newPrioridades: string[];

        if (value === 'nao') {
            newPrioridades = checked ? ['nao'] : [];
        } else {
            const otherPrioridades = currentPrioridades.filter(p => p !== 'nao');
            if (checked) {
                newPrioridades = [...otherPrioridades, value];
            } else {
                newPrioridades = otherPrioridades.filter(p => p !== value);
            }
        }
        return { ...prev, prioridadeLei: newPrioridades };
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
      
      <Section title="1. Descrição da Necessidade">
        <Field label="1.1. Qual a necessidade a ser atendida?" required>
          <textarea name="necessidade" value={data.necessidade} onChange={handleChange} required className={`${inputClasses} h-24`} />
        </Field>
      </Section>

      <Section title="2. Levantamento de Mercado">
        <Field label="2.1. Onde foram pesquisadas as possíveis soluções?" required>
            {['Consulta a fornecedores', 'Internet', 'Contratações similares', 'Audiência pública', 'Outro'].map(val => (
                <div key={val} className="flex items-center"><input type="checkbox" name="fontesPesquisa" value={val} checked={data.fontesPesquisa.includes(val)} onChange={handleCheckboxChange} className="mr-2"/><label className="dark:text-gray-300">{val}</label></div>
            ))}
            {data.fontesPesquisa.includes('Outro') && <input type="text" name="fonteOutro" value={data.fonteOutro} onChange={handleChange} placeholder="Especifique" className={`${inputClasses} mt-2`}/>}
        </Field>
        <Field label="2.2. Justificativa técnica e econômica para a escolha da melhor solução" required><textarea name="justificativaTecnica" value={data.justificativaTecnica} onChange={handleChange} required className={`${inputClasses} h-24`} /></Field>
        <Field label="2.3. Há restrição de fornecedores?" required><RadioGroup name="restricaoFornecedores" value={data.restricaoFornecedores} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}]} onChange={handleChange} /></Field>
      </Section>

      <Section title="3. Requisitos da Contratação">
        <Field label="3.1 - Qual o tipo de objeto?" required>
            <div className="flex flex-col gap-y-2">
                {[
                    {val: 'bem', label: 'Bem.'},
                    {val: 'servico', label: 'Serviço.'},
                    {val: 'locacao', label: 'Locação de imóvel.'},
                    {val: 'obra', label: 'Obra ou serviço de engenharia.'}
                ].map(opt => (
                    <div key={opt.val} className="flex items-start">
                        <input
                            type="checkbox"
                            id={`tipoObjeto-${opt.val}`}
                            name="tipoObjeto"
                            value={opt.val}
                            checked={data.tipoObjeto.includes(opt.val)}
                            onChange={handleCheckboxChange}
                            className="mr-2 h-4 w-4 mt-1 flex-shrink-0"
                        />
                        <label htmlFor={`tipoObjeto-${opt.val}`} className="dark:text-gray-300">{opt.label}</label>
                    </div>
                ))}
            </div>
        </Field>
        <Field label="3.2 - Qual a natureza?" required>
            <RadioGroup 
                name="natureza" 
                value={data.natureza} 
                options={[
                    {val: 'continuada', label: 'Continuada'}, 
                    {val: 'nao-continuada', label: 'Não-continuada'}
                ]} 
                onChange={handleChange} 
            />
        </Field>
        <Field label="3.3. Há monopólio?" required>
            <RadioGroup 
                name="monopolio" 
                value={data.monopolio} 
                options={[
                    {val: 'sim', label: 'Sim, apenas um único fornecedor é capaz de atender a demanda.'}, 
                    {val: 'nao', label: 'Não, há mais de um fornecedor capaz de atender a demanda.'}
                ]} 
                onChange={handleChange} 
            />
        </Field>
        <Field label="3.4. Qual a vigência do contrato?" required>
            <RadioGroup name="vigencia" value={data.vigencia} options={[
                {val: '30 dias (pronta entrega).', label: '30 dias (pronta entrega).'},
                {val: '180 dias.', label: '180 dias.'},
                {val: '12 meses.', label: '12 meses.'},
                {val: 'Indeterminado.', label: 'Indeterminado.'},
                {val: 'outro', label: 'Outro:'},
            ]} onChange={handleChange} />
            {data.vigencia === 'outro' && (
                <div className="flex items-center gap-2 mt-2 p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600">
                    <input type="number" name="vigenciaOutroNum" value={data.vigenciaOutroNum} onChange={handleChange} className={`${inputClasses} w-1/3`} placeholder="Nº"/>
                    <select name="vigenciaOutroTipo" value={data.vigenciaOutroTipo} onChange={handleChange} className={`${inputClasses} w-2/3`}>
                        <option value="dias">dias</option>
                        <option value="meses">meses</option>
                        <option value="anos">anos</option>
                    </select>
                </div>
            )}
        </Field>
        <Field label="3.5. Poderá haver prorrogação?" required><RadioGroup name="prorrogacao" value={data.prorrogacao} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}, {val: 'na', label: 'Não se aplica'}]} onChange={handleChange} /></Field>
        <Field label="3.6. Transição Contratual" required><RadioGroup name="transicao" value={data.transicao} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}]} onChange={handleChange} /></Field>
        {data.transicao === 'sim' && (
          <div className='grid md:grid-cols-2 gap-4 mt-2'>
            <input name="transicaoContrato" value={data.transicaoContrato} onChange={handleChange} placeholder="Nº do Contrato" className={inputClasses}/>
            <input name="transicaoPrazo" value={data.transicaoPrazo} onChange={handleChange} placeholder="Prazo" className={inputClasses}/>
          </div>
        )}
        <div className="mt-4">
            <h3 className="text-gray-700 dark:text-gray-300 font-semibold mb-2">3.7. Padrão Mínimo de Qualidade</h3>
            {data.padraoQualidade.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-md mb-2 bg-white dark:bg-gray-800 dark:border-gray-600">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold dark:text-gray-200">Item de Qualidade {index + 1}</h4>
                        <button onClick={() => removeQualidadeItem(item.id)} className="text-red-500 hover:text-red-700 font-bold">Remover</button>
                    </div>
                    <textarea value={item.descricao} onChange={(e) => handleQualidadeChange(item.id, e.target.value)} className={`${inputClasses} h-20`} placeholder="Descrição detalhada"/>
                </div>
            ))}
            <button onClick={addQualidadeItem} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition mt-2">➕ Adicionar Item de Qualidade</button>
        </div>
        <Field label="3.8. Critérios de Sustentabilidade">
            <div className="flex items-center">
                <input 
                    type="checkbox" 
                    id="sustentabilidade-check"
                    name="sustentabilidade" 
                    value="Critérios de sustentabilidade." 
                    checked={data.sustentabilidade.includes('Critérios de sustentabilidade.')} 
                    onChange={handleCheckboxChange} 
                    className="mr-2 h-4 w-4"
                />
                <label htmlFor="sustentabilidade-check" className="dark:text-gray-300">Apresenta critérios de sustentabilidade</label>
            </div>
            {data.sustentabilidade.includes('Critérios de sustentabilidade.') && (
                <textarea 
                    name="sustentabilidadeOutro" 
                    value={data.sustentabilidadeOutro} 
                    onChange={handleChange} 
                    className={`${inputClasses} h-20 mt-2`}
                    placeholder="Descreva os critérios de sustentabilidade."
                    required
                />
            )}
        </Field>
        <Field label="3.9. Será dada prioridade, sucessivamente, a bens e serviços que atendam a quais critérios?">
            <div className="flex flex-col gap-y-2">
                {[
                    {val: 'reciclados', label: 'Bens reciclados, recicláveis ou biodegradáveis'}, 
                    {val: 'ambiente', label: 'Bens e serviços que favoreçam a proteção do meio ambiente'}, 
                    {val: 'nao', label: 'Não se aplica'}
                ].map(opt => (
                    <div key={opt.val} className="flex items-center">
                        <input type="checkbox" id={`prioridadeLei-${opt.val}`} name="prioridadeLei" value={opt.val} checked={data.prioridadeLei.includes(opt.val)} onChange={handlePrioridadeChange} className="mr-2 h-4 w-4"/>
                        <label htmlFor={`prioridadeLei-${opt.val}`} className="dark:text-gray-300">{opt.label}</label>
                    </div>
                ))}
            </div>
            {data.prioridadeLei.length > 0 && !data.prioridadeLei.includes('nao') && (
                <textarea
                    name="prioridadeJust"
                    value={data.prioridadeJust}
                    onChange={handleChange}
                    className={`${inputClasses} h-20 mt-2`}
                    placeholder="Justifique a aplicação da prioridade."
                    required
                />
            )}
        </Field>
        <Field label="3.10. Necessidade de Treinamento" required><RadioGroup name="treinamento" value={data.treinamento} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}]} onChange={handleChange} /></Field>
      </Section>

       <Section title="4. Descrição da Solução como um todo">
         <Field label="4.1. Solução da Contratação" required><textarea name="solucaoContratacao" value={data.solucaoContratacao} onChange={handleChange} required className={`${inputClasses} h-24`}/></Field>
         <Field label="4.2. Garantia Contratual">
            <RadioGroup name="garantiaContratual" value={data.garantiaContratual} options={[
                {val: 'Garantia Legal', label: 'Garantia Legal'},
                {val: 'Não se aplica', label: 'Não se aplica'},
                {val: 'outro', label: 'Outro'},
            ]} onChange={handleChange} />
            {data.garantiaContratual === 'outro' && (
                <div className="flex items-center gap-2 mt-2 p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600">
                    <input type="number" name="garantiaOutroNum" value={data.garantiaOutroNum} onChange={handleChange} className={`${inputClasses} w-1/3`} placeholder="Nº"/>
                    <select name="garantiaOutroTipo" value={data.garantiaOutroTipo} onChange={handleChange} className={`${inputClasses} w-2/3`}>
                        <option value="dias">dias</option>
                        <option value="meses">meses</option>
                        <option value="anos">anos</option>
                    </select>
                </div>
            )}
         </Field>
         <Field label="4.3. Assistência Técnica" required><RadioGroup name="assistenciaTecnica" value={data.assistenciaTecnica} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}]} onChange={handleChange} /></Field>
         {data.assistenciaTecnica === 'sim' && <Field label="Justificativa Assistência"><input name="assistenciaJust" value={data.assistenciaJust} onChange={handleChange} className={inputClasses}/></Field>}
         <Field label="4.4. Manutenção" required><RadioGroup name="manutencao" value={data.manutencao} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}]} onChange={handleChange} /></Field>
         {data.manutencao === 'sim' && <Field label="Descrição Manutenção"><input name="manutencaoDesc" value={data.manutencaoDesc} onChange={handleChange} className={inputClasses}/></Field>}
       </Section>

      <Section title="5. Dimensionamento do Objeto">
        <Field label="5.1. Método para estimar as quantidades" required>
            {['Memória de cálculo', 'Histórico de consumo', 'Outro'].map(val => (
                <div key={val} className="flex items-center"><input type="checkbox" name="metodoQuantitativo" value={val} checked={data.metodoQuantitativo.includes(val)} onChange={handleCheckboxChange} className="mr-2"/><label className="dark:text-gray-300">{val}</label></div>
            ))}
            {data.metodoQuantitativo.includes('Outro') && <input type="text" name="metodoOutro" value={data.metodoOutro} onChange={handleChange} placeholder="Especifique" className={`${inputClasses} mt-2`}/>}
        </Field>
        <Field label="5.2. Descrição do Quantitativo" required><textarea name="descricaoQuantitativo" value={data.descricaoQuantitativo} onChange={handleChange} required className={`${inputClasses} h-24`}/></Field>
        <div className="mt-4">
            <h3 className="text-gray-700 dark:text-gray-300 font-semibold mb-2">5.3. Especificação</h3>
            {data.itens.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-md mb-2 bg-white dark:bg-gray-800 dark:border-gray-600">
                 <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold dark:text-gray-200">Item {index + 1}</h4>
                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 font-bold">Remover</button>
                </div>
                <Field label="Descrição" required><textarea value={item.descricao} onChange={e => handleItemChange(item.id, 'descricao', e.target.value)} required className={`${inputClasses} h-20`}/></Field>
                <div className="grid md:grid-cols-3 gap-4">
                    <Field label="Unidade" required><input type="text" value={item.unidade} onChange={e => handleItemChange(item.id, 'unidade', e.target.value)} required className={inputClasses}/></Field>
                    <Field label="Quantidade" required><input type="number" value={item.quantidade} onChange={e => handleItemChange(item.id, 'quantidade', parseFloat(e.target.value) || 0)} required className={inputClasses}/></Field>
                    <Field label="Valor Unitário (R$)" required><input type="number" value={item.valorUnitario} onChange={e => handleItemChange(item.id, 'valorUnitario', parseFloat(e.target.value) || 0)} required className={inputClasses}/></Field>
                </div>
              </div>
            ))}
            <button onClick={addItem} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition mt-2">➕ Adicionar Item</button>
        </div>
      </Section>
      
      <Section title="6. Estimativa do Valor da Contratação">
        <Field label="6.1. Estimativa de Preço">
            <div className="overflow-x-auto border rounded-lg dark:border-gray-600">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-4 py-3">Item</th>
                            <th scope="col" className="px-4 py-3">Descrição</th>
                            <th scope="col" className="px-4 py-3 text-right">Valor Unit.</th>
                            <th scope="col" className="px-4 py-3 text-center">Qtd</th>
                            <th scope="col" className="px-4 py-3 text-right">Valor Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.itens.length > 0 ? data.itens.map((item, index) => (
                            <tr key={item.id} className="bg-white border-b hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                                <th scope="row" className="px-4 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">{index + 1}</th>
                                <td className="px-4 py-2">{item.descricao}</td>
                                <td className="px-4 py-2 text-right">{item.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="px-4 py-2 text-center">{item.quantidade}</td>
                                <td className="px-4 py-2 text-right">{(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            </tr>
                        )) : (
                          <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"><td colSpan={5} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">Nenhum item adicionado.</td></tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold text-gray-900 bg-gray-100 dark:bg-gray-700 dark:text-white">
                            <th scope="row" colSpan={4} className="px-4 py-3 text-base text-right">VALOR TOTAL ESTIMADO</th>
                            <td className="px-4 py-3 text-base text-right">{totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </Field>
      </Section>

      <Section title="7. Justificativa para o Parcelamento ou Não">
          <Field label="7.1. Justificativa" required><textarea name="justificativaParcelamento" value={data.justificativaParcelamento} onChange={handleChange} required className={`${inputClasses} h-24`}/></Field>
      </Section>
      
      <Section title="8. Resultados Pretendidos">
          <Field label="8.1. Resultados" required><textarea name="resultadosPretendidos" value={data.resultadosPretendidos} onChange={handleChange} required className={`${inputClasses} h-24`}/></Field>
      </Section>
      
      <Section title="9. Providências a serem Adotadas">
          <Field label="9.1. Providências" required><textarea name="providencias" value={data.providencias} onChange={handleChange} required className={`${inputClasses} h-24`}/></Field>
      </Section>
      
      <Section title="10. Possíveis Impactos Ambientais">
          <Field label="10.1. Impactos" required><textarea name="impactosAmbientais" value={data.impactosAmbientais} onChange={handleChange} required className={`${inputClasses} h-24`}/></Field>
      </Section>

      <Section title="11. Contratações Correlatas e/ou Interdependentes">
          <Field label="11.1. Contratações" required><textarea name="contratacoesCorrelatas" value={data.contratacoesCorrelatas} onChange={handleChange} required className={`${inputClasses} h-24`}/></Field>
      </Section>
      
      <Section title="12. Declaração de Viabilidade">
          <Field label="12.1. A contratação possui viabilidade?" required><RadioGroup name="viabilidade" value={data.viabilidade} options={[{val: 'sim', label: 'Sim'}, {val: 'nao', label: 'Não'}]} onChange={handleChange} /></Field>
      </Section>

      <Section title="Assinatura">
        <div className="grid md:grid-cols-2 gap-6">
          <Field label="Cidade" required><input type="text" name="cidade" value={data.cidade} onChange={handleChange} required className={inputClasses} /></Field>
          <Field label="Data" required><input type="date" name="data" value={data.data} onChange={handleChange} required className={inputClasses} /></Field>
          <Field label="Nome do Servidor" required><input type="text" name="nome" value={data.nome} onChange={handleChange} required className={inputClasses} /></Field>
          <Field label="Cargo" required><input type="text" name="cargo" value={data.cargo} onChange={handleChange} required className={inputClasses} /></Field>
          <Field label="Matrícula" required><input type="text" name="matricula" value={data.matricula} onChange={handleChange} required className={inputClasses} /></Field>
        </div>
      </Section>
    </div>
  );
};