
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface AiAssistantProps {
  onGeneratedText: (text: string) => void;
  fieldName: string;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ onGeneratedText, fieldName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Por favor, insira uma ideia para o texto.');
      return;
    }
    setIsLoading(true);
    setError('');
    setGeneratedText('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const fullPrompt = `Você é um especialista em documentos de licitação para o setor público brasileiro.
Sua tarefa é gerar um texto claro, formal e conciso para o campo "${fieldName}" de um documento.
Baseado na seguinte ideia do usuário: "${prompt}"

Gere apenas o texto para o campo, sem introduções ou observações adicionais.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
      });

      setGeneratedText(response.text);
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao gerar o texto. Verifique o console para mais detalhes.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUseText = () => {
    onGeneratedText(generatedText);
    setIsModalOpen(false);
    setPrompt('');
    setGeneratedText('');
  };

  const openModal = () => {
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
    setPrompt('');
    setGeneratedText('');
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="absolute top-2 right-2 text-lg text-cbmpa-purple hover:text-cbmpa-red transition transform hover:scale-125"
        title="Gerar com Assistente IA"
      >
        ✨
      </button>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl transform transition-all">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Assistente IA para "{fieldName}"</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-800 text-3xl font-light">&times;</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="ai-prompt" className="block text-gray-700 font-semibold mb-2">Descreva sua ideia:</label>
                <input
                  id="ai-prompt"
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: compra de 10 novos computadores para o setor administrativo"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cbmpa-blue-end"
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cbmpa-red to-cbmpa-purple text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Gerando...' : 'Gerar com IA'}
              </button>

              {error && <p className="text-red-500 text-center">{error}</p>}

              {generatedText && (
                <div className="mt-4 p-4 border rounded-md bg-gray-50 max-h-60 overflow-y-auto">
                    <h3 className="font-bold mb-2">Texto Sugerido:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{generatedText}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end gap-4">
                <button onClick={closeModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button onClick={handleUseText} disabled={!generatedText} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  Usar este Texto
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
